package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import java.net.http.HttpClient;
import java.time.Duration;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ServiceUnavailableException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GroqChatClient {

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final GroqKeyProvider keyProvider;
    private final String model;
    private final RestClient restClient;

    public GroqChatClient(
            GroqKeyProvider keyProvider,
            @Value("${app.chat.model:openai/gpt-oss-120b}") String model
    ) {
        this.keyProvider = keyProvider;
        this.model = model;
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
        factory.setReadTimeout(Duration.ofSeconds(25));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public record LlmResult(String content, int tokensUsed, long latencyMs, String model) {
    }

    public LlmResult generateResponse(String systemPrompt, List<Map<String, String>> conversationHistory, String userMessage) {
        return generate(systemPrompt, conversationHistory, userMessage, null);
    }

    public LlmResult streamResponse(String systemPrompt, List<Map<String, String>> history, String message, java.util.function.Consumer<String> delta) {
        return generate(systemPrompt, history, message, delta);
    }

    private LlmResult generate(String systemPrompt, List<Map<String, String>> conversationHistory, String userMessage, java.util.function.Consumer<String> delta) {
        if (!keyProvider.hasKeys()) {
            throw new ServiceUnavailableException("The assistant is temporarily unavailable. Please use the contact form.");
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        int remainingBytes = 20000 - systemPrompt.getBytes(java.nio.charset.StandardCharsets.UTF_8).length
                - userMessage.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
        List<Map<String, String>> boundedHistory = new ArrayList<>();
        if (conversationHistory != null) {
            for (int i = conversationHistory.size() - 2; i >= 0; i -= 2) {
                var question = conversationHistory.get(i);
                var answer = conversationHistory.get(i + 1);
                int size = question.get("content").getBytes(java.nio.charset.StandardCharsets.UTF_8).length
                        + answer.get("content").getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
                if (size > remainingBytes) {
                    break;
                }
                boundedHistory.addFirst(answer);
                boundedHistory.addFirst(question);
                remainingBytes -= size;
            }
        }
        messages.addAll(boundedHistory);
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> requestBody = new java.util.HashMap<>(Map.of(
                "model", model,
                "messages", messages,
                "temperature", 0.3,
                "max_completion_tokens", 1200,
                "stream", delta != null
        ));
        if (model.startsWith("openai/gpt-oss")) {
            requestBody.put("reasoning_effort", "low");
        }

        long start = System.nanoTime();

        if (delta != null) {
            return keyProvider.executeWithKeyRotation(apiKey -> restClient.post()
                    .uri(GROQ_URL)
                    .header("Authorization", "Bearer " + apiKey)
                    .accept(MediaType.TEXT_EVENT_STREAM)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .exchange((request, response) -> {
                        if (response.getStatusCode().isError()) {
                            throw org.springframework.web.client.HttpClientErrorException.create(
                                    response.getStatusCode(), "Provider rejected request", response.getHeaders(), new byte[0], null);
                        }
                        return readStream(response.getBody(), delta, model, start);
                    }));
        }
        return keyProvider.executeWithKeyRotation(apiKey -> {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(GROQ_URL)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("User-Agent", "V.T.Thanh-Home/1.0")
                    .accept(MediaType.APPLICATION_JSON)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            long latency = (System.nanoTime() - start) / 1_000_000;

            if (response == null || !response.containsKey("choices")) {
                throw new IllegalStateException("Invalid response from Groq API");
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices.isEmpty()) {
                throw new IllegalStateException("Empty choices list from Groq API");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) message.get("content");

            if (content == null || content.isBlank() || content.length() > 20000) {
                throw new ServiceUnavailableException("The assistant returned an invalid response");
            }
            int tokensUsed = 0;
            if (response.containsKey("usage")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> usage = (Map<String, Object>) response.get("usage");
                Number total = (Number) usage.getOrDefault("total_tokens", 0);
                tokensUsed = total.intValue();
            }

            return new LlmResult(content, tokensUsed, latency, model);
        });
    }
    static LlmResult readStream(java.io.InputStream input, java.util.function.Consumer<String> delta, String model, long start) throws java.io.IOException {
        var mapper = new tools.jackson.databind.json.JsonMapper();
        var text = new StringBuilder();
        var data = new StringBuilder();
        int tokens = 0;
        try (var reader = new java.io.BufferedReader(new java.io.InputStreamReader(input, java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (Thread.currentThread().isInterrupted()) {
                    throw new java.io.InterruptedIOException();
                }
                if (line.length() > 65536) {
                    throw new java.io.IOException("Provider event too large");
                }
                if (line.startsWith("data:")) {
                    if (!data.isEmpty()) {
                        data.append('\n');
                    }
                    data.append(line.substring(5).stripLeading());
                    if (data.length() > 65536) {
                        throw new java.io.IOException("Provider event too large");
                    }
                } else if (line.isEmpty() && !data.isEmpty()) {
                    String payload = data.toString();
                    data.setLength(0);
                    if ("[DONE]".equals(payload)) {
                        if (text.isEmpty() || text.toString().isBlank()) {
                            throw new java.io.IOException("Empty provider response");
                        }
                        return new LlmResult(text.toString(), tokens, (System.nanoTime() - start) / 1_000_000, model);
                    }
                    var event = mapper.readTree(payload);
                    if (event.has("error")) {
                        throw new java.io.IOException("Provider stream failed");
                    }
                    var content = event.path("choices").path(0).path("delta").path("content");
                    if (content.isString()) {
                        String chunk = content.asString();
                        if (text.length() + chunk.length() > 20000) {
                            throw new java.io.IOException("Provider response too large");
                        }
                        text.append(chunk);
                        delta.accept(chunk);
                    }
                    tokens = event.path("x_groq").path("usage").path("total_tokens").asInt(tokens);
                }
            }
        }
        throw new java.io.IOException("Provider stream ended before completion");
    }

}
