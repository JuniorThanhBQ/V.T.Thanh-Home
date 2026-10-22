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
                "stream", false
        ));
        if (model.startsWith("openai/gpt-oss")) {
            requestBody.put("reasoning_effort", "low");
        }

        long start = System.nanoTime();

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
}
