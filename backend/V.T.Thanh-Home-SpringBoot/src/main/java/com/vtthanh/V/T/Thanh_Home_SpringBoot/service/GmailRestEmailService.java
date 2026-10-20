package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Contact;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Service
public class GmailRestEmailService {

    private static final Logger log = LoggerFactory.getLogger(GmailRestEmailService.class);
    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

    private final String clientId;
    private final String clientSecret;
    private final String refreshToken;
    private final String fromEmail;
    private final String fromName;
    private final String recipientEmail;
    private final RestClient restClient;

    private volatile String cachedAccessToken;
    private volatile Instant tokenExpiresAt = Instant.MIN;

    public GmailRestEmailService(
            @Value("${app.mail.gmail.client-id:}") String clientId,
            @Value("${app.mail.gmail.client-secret:}") String clientSecret,
            @Value("${app.mail.gmail.refresh-token:}") String refreshToken,
            @Value("${app.mail.from-email:}") String fromEmail,
            @Value("${app.mail.from-name:V.T.Thanh}") String fromName,
            @Value("${app.mail.recipient-email:}") String recipientEmail
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.recipientEmail = recipientEmail;
        this.restClient = RestClient.create();
    }

    public boolean isConfigured() {
        return refreshToken != null && !refreshToken.isBlank()
                && clientId != null && !clientId.isBlank()
                && clientSecret != null && !clientSecret.isBlank();
    }

    public void sendContactNotification(Contact contact) {
        if (!isConfigured()) {
            log.info("Gmail OAuth2 credentials not fully configured; skipping actual HTTPS email delivery for contact id={}", contact.getId());
            return;
        }

        String accessToken = getValidAccessToken();
        String rawBase64Url = createMimeMessageBase64Url(contact);

        restClient.post()
                .uri(GMAIL_SEND_URL)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("raw", rawBase64Url))
                .retrieve()
                .toBodilessEntity();

        log.info("Successfully delivered contact notification email via Gmail REST API for contact id={}", contact.getId());
    }

    private synchronized String getValidAccessToken() {
        if (cachedAccessToken != null && Instant.now().isBefore(tokenExpiresAt)) {
            return cachedAccessToken;
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("refresh_token", refreshToken);
        form.add("grant_type", "refresh_token");

        @SuppressWarnings("unchecked")
        Map<String, Object> tokenResponse = restClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
            throw new IllegalStateException("Failed to retrieve access token from Google OAuth2 endpoint");
        }

        String accessToken = (String) tokenResponse.get("access_token");
        Number expiresIn = (Number) tokenResponse.getOrDefault("expires_in", 3600);
        this.cachedAccessToken = accessToken;
        this.tokenExpiresAt = Instant.now().plusSeconds(Math.max(60, expiresIn.longValue() - 120));
        return accessToken;
    }

    private String createMimeMessageBase64Url(Contact contact) {
        String fullName = (contact.getFirstName() + " " + (contact.getLastName() != null ? contact.getLastName() : "")).trim();
        String emailSubject = "Portfolio Contact: " + contact.getSubject() + " - " + fullName;
        String encodedSubject = "=?UTF-8?B?" + Base64.getEncoder().encodeToString(emailSubject.getBytes(StandardCharsets.UTF_8)) + "?=";

        StringBuilder bodyBuilder = new StringBuilder();
        bodyBuilder.append("New contact message received from your portfolio:\n\n");
        bodyBuilder.append("Name: ").append(fullName).append("\n");
        bodyBuilder.append("Email: ").append(contact.getEmail()).append("\n");
        if (contact.getPhone() != null && !contact.getPhone().isBlank()) {
            bodyBuilder.append("Phone: ").append(contact.getPhone()).append("\n");
        }
        bodyBuilder.append("Subject / Service: ").append(contact.getSubject()).append("\n");
        bodyBuilder.append("Date: ").append(contact.getCreatedDate()).append("\n");
        if (contact.getIpAddress() != null) {
            bodyBuilder.append("IP Address: ").append(contact.getIpAddress()).append("\n");
        }
        bodyBuilder.append("\nMessage:\n").append(contact.getMessage()).append("\n");

        String bodyBase64 = Base64.getEncoder().encodeToString(bodyBuilder.toString().getBytes(StandardCharsets.UTF_8));

        String toAddress = (recipientEmail != null && !recipientEmail.isBlank()) ? recipientEmail : fromEmail;
        String rfc2822 = "From: " + fromName + " <" + fromEmail + ">\r\n"
                + "To: " + toAddress + "\r\n"
                + "Reply-To: " + contact.getEmail() + "\r\n"
                + "Subject: " + encodedSubject + "\r\n"
                + "MIME-Version: 1.0\r\n"
                + "Content-Type: text/plain; charset=UTF-8\r\n"
                + "Content-Transfer-Encoding: base64\r\n\r\n"
                + bodyBase64;

        return Base64.getUrlEncoder().withoutPadding().encodeToString(rfc2822.getBytes(StandardCharsets.UTF_8));
    }
}
