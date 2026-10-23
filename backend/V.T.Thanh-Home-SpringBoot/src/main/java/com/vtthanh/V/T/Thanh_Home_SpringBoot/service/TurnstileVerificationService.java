package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TurnstileVerificationService {
    private final boolean enabled;
    private final String secret;
    private final String siteKey;
    private final Set<String> hostnames;
    private final RestClient client;

    public TurnstileVerificationService(@Value("${app.turnstile.enabled:false}") boolean enabled,
            @Value("${app.turnstile.secret-key:}") String secret,
            @Value("${app.turnstile.site-key:}") String siteKey,
            @Value("${app.turnstile.hostnames:www.juniorthanh.id.vn}") String hostnames) {
        this.enabled = enabled;
        this.secret = secret;
        this.siteKey = siteKey;
        this.hostnames = Arrays.stream(hostnames.split(",")).map(String::trim).collect(Collectors.toSet());
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.client = RestClient.builder().requestFactory(factory).build();
    }

    public String publicSiteKey() {
        return enabled ? siteKey : "";
    }

    public void verifyToken(String token, String ip) {
        verifyToken(token, ip, "contact");
    }

    public void verifyToken(String token, String ip, String action) {
        if (!enabled) {
            return;
        }
        if (secret.isBlank() || siteKey.isBlank()) {
            throw new ServiceUnavailableException("Security verification is temporarily unavailable");
        }
        if (token == null || token.isBlank() || token.length() > 2048) {
            throw new IllegalArgumentException("Security verification token is required");
        }
        var form = new LinkedMultiValueMap<String, String>();
        form.add("secret", secret);
        form.add("response", token);
        Map<?, ?> result;
        try {
            result = client.post().uri("https://challenges.cloudflare.com/turnstile/v0/siteverify")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(Map.class);
        } catch (org.springframework.web.client.RestClientException ex) {
            throw new ServiceUnavailableException("Security verification is temporarily unavailable");
        }
        if (result == null || !Boolean.TRUE.equals(result.get("success"))
                || !action.equals(result.get("action")) || !hostnames.contains(result.get("hostname"))) {
            throw new IllegalArgumentException("Security verification failed. Please retry.");
        }
    }
}
