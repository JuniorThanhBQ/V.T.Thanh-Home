package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;

@Component
public class GroqKeyProvider {

    private static final Logger log = LoggerFactory.getLogger(GroqKeyProvider.class);

    private final List<String> keys = new ArrayList<>();
    private final AtomicInteger currentIndex = new AtomicInteger(0);

    public GroqKeyProvider(
            @Value("${app.chat.groq-api-keys:}") String rawKeys,
            @Value("${app.chat.groq-api-key:}") String singleKey
    ) {
        parseAndAddKeys(rawKeys);
        if (singleKey != null && !singleKey.isBlank() && !keys.contains(singleKey.trim())) {
            keys.add(singleKey.trim());
        }
    }

    public boolean hasKeys() {
        return !keys.isEmpty();
    }

    public int getKeyCount() {
        return keys.size();
    }

    public <T> T executeWithKeyRotation(Function<String, T> action) {
        if (keys.isEmpty()) {
            throw new IllegalStateException("No Groq API keys available");
        }

        int attempts = Math.min(keys.size(), 2);
        Exception lastException = null;

        for (int i = 0; i < attempts; i++) {
            int index = Math.abs(currentIndex.getAndIncrement() % keys.size());
            String key = keys.get(index);
            try {
                return action.apply(key);
            } catch (Exception ex) {
                if (!(ex instanceof org.springframework.web.client.RestClientResponseException response)
                        || (response.getStatusCode().value() != 401 && response.getStatusCode().value() != 403
                        && response.getStatusCode().value() != 429)) {
                    throw ex;
                }
                lastException = ex;
                log.warn("Groq request failed with key index {} and exception type {}", index, ex.getClass().getSimpleName());
            }
        }

        if (lastException instanceof RuntimeException re) {
            throw re;
        }
        throw new IllegalStateException("All configured Groq API keys failed", lastException);
    }

    private void parseAndAddKeys(String raw) {
        if (raw == null || raw.isBlank()) {
            return;
        }

        String cleaned = raw.trim();
        if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
            cleaned = cleaned.substring(1, cleaned.length() - 1);
        }

        String[] parts = cleaned.split("[,;]");
        Arrays.stream(parts)
                .map(String::trim)
                .map(k -> k.replaceAll("^[\"']+|[\"']+$", ""))
                .filter(k -> !k.isBlank())
                .forEach(k -> {
                    if (!keys.contains(k)) {
                        keys.add(k);
                    }
                });
    }
}
