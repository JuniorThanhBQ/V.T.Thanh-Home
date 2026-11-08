package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ServiceUnavailableException;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.RateLimitExceededException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.http.HttpClient;
import java.time.Duration;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

@Service
public class GeminiSpeechService {
    private static final int MAX_AUDIO_BYTES = 16500000;
    private static final int MAX_EVENT_CHARS = 1000000;
    private static final int OUTPUT_CHUNK_BYTES = 9600;
    private static final MediaType EVENT_STREAM = MediaType.TEXT_EVENT_STREAM;
    private static final JsonMapper JSON = new JsonMapper();
    private final List<String> keys;
    private final String model;
    private final String voice;
    private final int dailyLimit;
    private final RestClient client;
    private final AtomicInteger keyIndex = new AtomicInteger();
    private final Semaphore capacity = new Semaphore(1);
    private final Map<String, CachedAudio> cache = new LinkedHashMap<>();
    private java.time.LocalDate day = java.time.LocalDate.now(java.time.ZoneOffset.UTC);
    private int generations;
    private long quotaRetryAt;
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GeminiSpeechService.class);

    public GeminiSpeechService(@Value("${GEMINI_API_KEY:}") String rawKeys,
            @Value("${GEMINI_TTS_MODEL:gemini-3.8-flash-lite-tts}") String model,
            @Value("${GEMINI_TTS_VOICE:Kore}") String voice,
            @Value("${GEMINI_TTS_DAILY_LIMIT:100}") int dailyLimit) {
        this.keys = parseKeys(rawKeys);
        if (!model.matches("[a-zA-Z0-9.-]+") || !voice.matches("[a-zA-Z0-9_-]+")) {
            throw new IllegalArgumentException("Invalid speech configuration");
        }
        this.model = model;
        this.voice = voice;
        this.dailyLimit = dailyLimit;
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
        factory.setReadTimeout(Duration.ofSeconds(40));
        this.client = RestClient.builder().requestFactory(factory).build();
    }

    static List<String> parseKeys(String raw) {
        return Arrays.stream(raw.replace("[", "").replace("]", "").split("[,;]"))
                .map(String::trim).map(key -> key.replace("\"", "").replace("'", ""))
                .filter(key -> !key.isBlank()).distinct().toList();
    }

    public byte[] generate(String id, String reply) {
        var replay = cached(id);
        if (replay != null) {
            return replay.audio();
        }
        acquire();
        try {
            replay = cached(id);
            if (replay != null) {
                return replay.audio();
            }
            var body = reserve(reply);
            JsonNode result = null;
            for (int attempt = 0; attempt < Math.min(2, keys.size()); attempt++) {
                String key = keys.get(Math.floorMod(keyIndex.getAndIncrement(), keys.size()));
                try {
                    result = client.post().uri("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent")
                            .header("x-goog-api-key", key).body(body).retrieve().body(JsonNode.class);
                    break;
                } catch (org.springframework.web.client.RestClientResponseException ex) {
                    int status = ex.getStatusCode().value();
                    log.warn("Speech provider rejected request: model={}, status={}, keySlot={}", model, status,
                            Math.floorMod(keyIndex.get() - 1, keys.size()) + 1);
                    if (retryKey(status, attempt)) {
                        continue;
                    }
                    throw providerError(status, ex.getResponseBodyAsString());
                }
            }
            if (result == null) {
                throw new ServiceUnavailableException("No speech returned");
            }
            var parts = result.path("candidates").path(0).path("content").path("parts");
            byte[] audio = null;
            for (var part : parts) {
                var data = part.path("inlineData");
                String mime = data.path("mimeType").asString("");
                String encoded = data.path("data").asString("");
                if (encoded.isEmpty()) {
                    continue;
                }
                if (encoded.length() > 22000000) {
                    throw new ServiceUnavailableException("Speech response too large");
                }
                byte[] bytes = Base64.getDecoder().decode(encoded);
                if (mime.startsWith("audio/L16") && mime.contains("rate=24000")) {
                    audio = wav(bytes);
                } else if (mime.equals("audio/wav") && bytes.length > 44
                        && new String(bytes, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")) {
                    audio = bytes;
                }
                break;
            }
            if (audio == null) {
                throw new ServiceUnavailableException("Invalid speech response");
            }
            remember(id, audio);
            return audio;
        } catch (org.springframework.web.client.RestClientException | IllegalArgumentException ex) {
            log.warn("Speech request failed: model={}, type={}", model, ex.getClass().getSimpleName());
            throw new ServiceUnavailableException("Speech connection, timeout, or audio decoding failed. Please try later.");
        } finally {
            capacity.release();
        }
    }

    public void stream(String id, String reply, Consumer<byte[]> output) {
        if (replay(id, output)) {
            return;
        }
        acquire();
        try {
            if (replay(id, output)) {
                return;
            }
            var body = reserve(reply);
            for (int attempt = 0; attempt < Math.min(2, keys.size()); attempt++) {
                int currentAttempt = attempt;
                String key = keys.get(Math.floorMod(keyIndex.getAndIncrement(), keys.size()));
                byte[] pcm = client.post()
                        .uri("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":streamGenerateContent?alt=sse")
                        .contentType(MediaType.APPLICATION_JSON).accept(EVENT_STREAM).header("x-goog-api-key", key).body(body)
                        .exchange((request, response) -> {
                            int status = response.getStatusCode().value();
                            try (var input = response.getBody()) {
                                if (retryKey(status, currentAttempt)) {
                                    return null;
                                }
                                if (status != 200) {
                                    String error = status == 429
                                            ? new String(input.readNBytes(65536), StandardCharsets.UTF_8) : "";
                                    throw providerError(status, error);
                                }
                                MediaType type = response.getHeaders().getContentType();
                                if (type == null || !EVENT_STREAM.isCompatibleWith(type)) {
                                    throw new ServiceUnavailableException("Invalid speech stream");
                                }
                                return readPcm(input, output);
                            }
                        });
                if (pcm != null) {
                    if (Thread.currentThread().isInterrupted()) {
                        throw new java.util.concurrent.CancellationException();
                    }
                    remember(id, wav(pcm));
                    return;
                }
            }
            throw new ServiceUnavailableException("No speech returned");
        } catch (org.springframework.web.client.RestClientException | tools.jackson.core.JacksonException | IllegalArgumentException ex) {
            log.warn("Speech stream failed: model={}, type={}", model, ex.getClass().getSimpleName());
            throw new ServiceUnavailableException("Speech connection, timeout, or audio decoding failed. Please try later.");
        } finally {
            capacity.release();
        }
    }

    static byte[] readPcm(InputStream input, Consumer<byte[]> output) throws IOException {
        var reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8));
        var event = new StringBuilder();
        var pcm = new ByteArrayOutputStream();
        for (String line; (line = boundedLine(reader)) != null; ) {
            if (line.startsWith("data:")) {
                if (event.length() + line.length() > MAX_EVENT_CHARS) {
                    throw new IOException("Speech frame too large");
                }
                event.append(line, 5, line.length()).append('\n');
            } else if (line.isEmpty() && !event.isEmpty()) {
                var json = JSON.readTree(event.toString());
                event.setLength(0);
                if (json.has("error")) {
                    throw new IOException("Speech stream failed");
                }
                var candidate = json.path("candidates").path(0);
                String reason = candidate.path("finishReason").asString("");
                if (!reason.isEmpty() && !"STOP".equals(reason)) {
                    throw new IOException("Speech generation did not finish");
                }
                for (var part : candidate.path("content").path("parts")) {
                    var inline = part.path("inlineData");
                    if (inline.isMissingNode()) {
                        continue;
                    }
                    MediaType format = MediaType.parseMediaType(inline.path("mimeType").asString(""));
                    String channels = format.getParameter("channels");
                    if (!"audio".equalsIgnoreCase(format.getType()) || !"l16".equalsIgnoreCase(format.getSubtype())
                            || !"24000".equals(format.getParameter("rate")) || channels != null && !"1".equals(channels)) {
                        throw new IOException("Invalid speech format");
                    }
                    byte[] chunk = Base64.getDecoder().decode(inline.path("data").asString(""));
                    if (pcm.size() + chunk.length > MAX_AUDIO_BYTES) {
                        throw new IOException("Speech response too large");
                    }
                    pcm.writeBytes(chunk);
                    emitChunks(chunk, 0, chunk.length, output);
                }
                if ("STOP".equals(reason) && pcm.size() > 0 && pcm.size() % 2 == 0) {
                    return pcm.toByteArray();
                }
                if ("STOP".equals(reason)) {
                    break;
                }
            }
        }
        throw new IOException("Incomplete speech stream");
    }

    private static String boundedLine(BufferedReader reader) throws IOException {
        var line = new StringBuilder();
        for (int ch; (ch = reader.read()) != -1; ) {
            if (ch == '\n') {
                if (!line.isEmpty() && line.charAt(line.length() - 1) == '\r') {
                    line.setLength(line.length() - 1);
                }
                return line.toString();
            }
            if (line.length() >= MAX_EVENT_CHARS) {
                throw new IOException("Speech frame too large");
            }
            line.append((char) ch);
        }
        return null;
    }

    private void acquire() {
        if (!capacity.tryAcquire()) {
            throw new ServiceUnavailableException("Speech is busy. Please try again.");
        }
    }

    private Map<String, ?> reserve(String reply) {
        if (System.currentTimeMillis() < quotaRetryAt) {
            throw quotaExceeded();
        }
        if (keys.isEmpty()) {
            throw new ServiceUnavailableException("Speech is not configured");
        }
        String text = plainText(reply);
        if (text.isBlank() || text.length() > 5000) {
            throw new ServiceUnavailableException("Reply cannot be read aloud");
        }
        var today = java.time.LocalDate.now(java.time.ZoneOffset.UTC);
        if (!today.equals(day)) {
            day = today;
            generations = 0;
        }
        if (generations >= dailyLimit) {
            throw new ServiceUnavailableException("Daily speech capacity reached");
        }
        generations++;
        return Map.of("contents", List.of(Map.of("role", "user", "parts", List.of(Map.of(
                "text", text, "speech_metadata", Map.of("style", "natural and friendly"))))),
                "generationConfig", Map.of("responseModalities", List.of("AUDIO"), "maxOutputTokens", 8192,
                "speechConfig", Map.of("voiceConfig", Map.of("voice", voice))));
    }

    private boolean retryKey(int status, int attempt) {
        return (status == 401 || status == 403) && attempt + 1 < Math.min(2, keys.size());
    }

    private RuntimeException providerError(int status, String body) {
        if (status == 429) {
            quotaRetryAt = System.currentTimeMillis() + retryDelayMillis(body);
            return quotaExceeded();
        }
        return new ServiceUnavailableException(status == 400 || status == 404
                ? "Speech model or request configuration was rejected by the provider."
                : status == 401 || status == 403 ? "Speech provider authentication or access failed."
                : "Speech provider temporarily unavailable. Please try later.");
    }

    private synchronized CachedAudio cached(String id) {
        long now = System.currentTimeMillis();
        cache.values().removeIf(entry -> entry.expires() <= now);
        return cache.get(id);
    }

    private synchronized void remember(String id, byte[] audio) {
        if (audio.length > MAX_AUDIO_BYTES + 44) {
            return;
        }
        cache.remove(id);
        while (cache.size() >= 4 || cache.values().stream().mapToInt(item -> item.audio().length).sum()
                + audio.length > MAX_AUDIO_BYTES + 44) {
            cache.remove(cache.keySet().iterator().next());
        }
        cache.put(id, new CachedAudio(audio, System.currentTimeMillis() + 600000));
    }

    private boolean replay(String id, Consumer<byte[]> output) {
        var entry = cached(id);
        if (entry == null) {
            return false;
        }
        var buffer = ByteBuffer.wrap(entry.audio()).order(ByteOrder.LITTLE_ENDIAN);
        boolean pcm = false;
        for (int offset = 12; offset <= buffer.limit() - 8; ) {
            int length = buffer.getInt(offset + 4);
            int start = offset + 8;
            if (length < 0 || length > buffer.limit() - start) {
                return false;
            }
            String type = new String(entry.audio(), offset, 4, StandardCharsets.US_ASCII);
            if ("fmt ".equals(type) && length >= 16) {
                pcm = buffer.getShort(start) == 1 && buffer.getShort(start + 2) == 1
                        && buffer.getInt(start + 4) == 24000 && buffer.getShort(start + 12) == 2
                        && buffer.getShort(start + 14) == 16;
            } else if ("data".equals(type) && pcm && length > 0 && length % 2 == 0) {
                emitChunks(entry.audio(), start, length, output);
                return true;
            }
            offset = start + length + (length & 1);
        }
        return false;
    }

    private static void emitChunks(byte[] bytes, int start, int length, Consumer<byte[]> output) {
        for (int pos = start; pos < start + length; pos += OUTPUT_CHUNK_BYTES) {
            if (Thread.currentThread().isInterrupted()) {
                throw new java.util.concurrent.CancellationException();
            }
            output.accept(Arrays.copyOfRange(bytes, pos, Math.min(pos + OUTPUT_CHUNK_BYTES, start + length)));
        }
    }

    private RateLimitExceededException quotaExceeded() {
        long seconds = Math.max(1, (quotaRetryAt - System.currentTimeMillis() + 999) / 1000);
        return new RateLimitExceededException(
                "Speech provider quota exhausted. Try again in " + seconds + " seconds.");
    }

    static long retryDelayMillis(String body) {
        try {
            var error = new tools.jackson.databind.json.JsonMapper().readTree(body).path("error");
            for (var detail : error.path("details")) {
                if (!"type.googleapis.com/google.rpc.RetryInfo".equals(detail.path("@type").asString(""))) {
                    continue;
                }
                String delay = detail.path("retryDelay").asString("");
                if (delay.matches("[0-9]+(\\.[0-9]+)?s")) {
                    double seconds = Double.parseDouble(delay.substring(0, delay.length() - 1));
                    return (long) Math.ceil(Math.max(1, Math.min(86400, seconds)) * 1000);
                }
            }
        } catch (RuntimeException ex) {
            return 60000;
        }
        return 60000;
    }

    static String plainText(String text) {
        return text.replaceAll("(?s)```.*?```", " ").replaceAll("`[^`]*`", " ")
                .replaceAll("!\\[[^\\]]*\\]\\([^)]*\\)", " ")
                .replaceAll("\\[([^\\]]+)\\]\\([^)]*\\)", "$1")
                .replaceAll("https?://\\S+", " ").replaceAll("<[^>]*>", " ")
                .replaceAll("(?m)^[#> *|_-]+", "").replaceAll("[*_~|]", " ").replaceAll("\\s+", " ").trim();
    }

    static byte[] wav(byte[] pcm) {
        if (pcm.length == 0 || pcm.length % 2 != 0) {
            throw new IllegalArgumentException("Invalid PCM");
        }
        var buffer = ByteBuffer.allocate(44 + pcm.length).order(ByteOrder.LITTLE_ENDIAN);
        buffer.put("RIFF".getBytes(StandardCharsets.US_ASCII)).putInt(36 + pcm.length);
        buffer.put("WAVEfmt ".getBytes(StandardCharsets.US_ASCII)).putInt(16).putShort((short) 1).putShort((short) 1);
        buffer.putInt(24000).putInt(48000).putShort((short) 2).putShort((short) 16);
        buffer.put("data".getBytes(StandardCharsets.US_ASCII)).putInt(pcm.length).put(pcm);
        return buffer.array();
    }

    private record CachedAudio(byte[] audio, long expires) { }
}
