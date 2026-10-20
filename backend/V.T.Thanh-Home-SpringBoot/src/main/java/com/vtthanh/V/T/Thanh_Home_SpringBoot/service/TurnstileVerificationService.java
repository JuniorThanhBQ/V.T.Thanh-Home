package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Service
public class TurnstileVerificationService {

    private static final Logger log = LoggerFactory.getLogger(TurnstileVerificationService.class);
    private static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private final String secretKey;
    private final RestClient restClient;

    public TurnstileVerificationService(@Value("${app.turnstile.secret-key:}") String secretKey) {
        this.secretKey = secretKey;
        this.restClient = RestClient.create();
    }

    public void verifyToken(String token, String remoteIp) {
        if (secretKey == null || secretKey.isBlank() || "dummy".equalsIgnoreCase(secretKey)) {
            return;
        }

        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Security verification token is required");
        }

        try {
            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("secret", secretKey);
            formData.add("response", token);
            if (remoteIp != null && !remoteIp.isBlank()) {
                formData.add("remoteip", remoteIp);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(VERIFY_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !Boolean.TRUE.equals(response.get("success"))) {
                log.warn("Turnstile validation failed: response={}", response);
                throw new IllegalArgumentException("Security verification failed. Please refresh and retry.");
            }
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Error communicating with Cloudflare Turnstile service: {}", ex.getMessage());
            throw new IllegalArgumentException("Unable to verify security challenge. Please try again.");
        }
    }
}
