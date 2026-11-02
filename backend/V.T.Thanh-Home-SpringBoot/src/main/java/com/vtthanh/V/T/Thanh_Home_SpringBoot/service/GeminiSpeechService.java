package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import tools.jackson.databind.JsonNode;
import java.net.http.HttpClient;
import java.time.Duration;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class GeminiSpeechService {
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
        if (!capacity.tryAcquire()) {
            throw new ServiceUnavailableException("Speech is busy. Please try again.");
        }
        try {
            long now = System.currentTimeMillis();
            cache.values().removeIf(entry -> entry.expires() < now);
            var cached = cache.get(id);
            if (cached != null) {
                return cached.audio();
            }
            if (now < quotaRetryAt) {
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
            var body = Map.of("contents", List.of(Map.of("role", "user", "parts", List.of(Map.of(
                    "text", text, "speech_metadata", Map.of("style", "natural and friendly"))))),
                    "generationConfig", Map.of("responseModalities", List.of("AUDIO"), "maxOutputTokens", 8192,
                    "speechConfig", Map.of("voiceConfig", Map.of("voice", voice))));
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
                    if (status == 429) {
                        quotaRetryAt = System.currentTimeMillis() + retryDelayMillis(ex.getResponseBodyAsString());
                        throw quotaExceeded();
                    }
                    if ((ex.getStatusCode().value() == 401 || ex.getStatusCode().value() == 403)
                            && attempt + 1 < Math.min(2, keys.size())) {
                        continue;
                    }
                    throw new ServiceUnavailableException(status == 400 || status == 404
                            ? "Speech model or request configuration was rejected by the provider."
                            : status == 401 || status == 403 ? "Speech provider authentication or access failed."
                            : "Speech provider temporarily unavailable. Please try later.");
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
            if (cache.size() >= 4) {
                cache.remove(cache.keySet().iterator().next());
            }
            cache.put(id, new CachedAudio(audio, now + 600000));
            return audio;
        } catch (org.springframework.web.client.RestClientException | IllegalArgumentException ex) {
            log.warn("Speech request failed: model={}, type={}", model, ex.getClass().getSimpleName());
            throw new ServiceUnavailableException("Speech connection, timeout, or audio decoding failed. Please try later.");
        } finally {
            capacity.release();
        }
    }

    private com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.RateLimitExceededException quotaExceeded() {
        long seconds = Math.max(1, (quotaRetryAt - System.currentTimeMillis() + 999) / 1000);
        return new com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.RateLimitExceededException(
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
