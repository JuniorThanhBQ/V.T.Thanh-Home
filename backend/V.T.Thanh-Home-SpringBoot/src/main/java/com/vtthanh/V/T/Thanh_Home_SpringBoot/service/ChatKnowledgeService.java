package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import java.net.http.HttpClient;
import java.net.URI;
import java.time.Duration;
import org.springframework.web.client.RestClient;

@Service
public class ChatKnowledgeService {

    private static final Logger log = LoggerFactory.getLogger(ChatKnowledgeService.class);

    private final String chatFileUrl;
    private final RestClient restClient;

    private volatile String cachedKnowledge;

    public ChatKnowledgeService(@Value("${app.chat.file-url:}") String chatFileUrl) {
        this.chatFileUrl = chatFileUrl;
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).followRedirects(HttpClient.Redirect.NORMAL).build());
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public String getKnowledgeBase() {
        if (cachedKnowledge != null) {
            return cachedKnowledge;
        }

        synchronized (this) {
            if (cachedKnowledge != null) {
                return cachedKnowledge;
            }

            if (chatFileUrl != null && !chatFileUrl.isBlank()) {
                try {
                    URI uri = URI.create(chatFileUrl);
                    if ("drive.google.com".equalsIgnoreCase(uri.getHost())) {
                        var fileId = java.util.regex.Pattern.compile("/file/d/([A-Za-z0-9_-]+)").matcher(uri.getPath());
                        if (fileId.find()) {
                            uri = URI.create("https://drive.google.com/uc?export=download&id=" + fileId.group(1));
                        }
                    }
                    if (!"https".equals(uri.getScheme()) || uri.getUserInfo() != null) {
                        throw new IllegalArgumentException("Knowledge URL must use HTTPS");
                    }
                    String content = restClient.get().uri(uri).exchange((request, response) -> {
                        if (!response.getStatusCode().is2xxSuccessful()) {
                            throw new IllegalStateException("Knowledge source unavailable");
                        }
                        byte[] bytes = response.getBody().readNBytes(96001);
                        if (bytes.length > 96000) {
                            throw new IllegalArgumentException("Knowledge source exceeds allowed size");
                        }
                        return new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
                    });

                    if (content != null && !content.isBlank()) {
                        String leading = content.stripLeading().toLowerCase(java.util.Locale.ROOT);
                        if (leading.startsWith("<!doctype html") || leading.startsWith("<html")) {
                            throw new IllegalArgumentException("Knowledge source must return plain text or Markdown");
                        }
                        log.info("Loaded portfolio knowledge base");
                        byte[] utf8 = content.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                        this.cachedKnowledge = new String(utf8, 0, Math.min(utf8.length, 12000), java.nio.charset.StandardCharsets.UTF_8).trim();
                        return this.cachedKnowledge;
                    }
                } catch (Exception ex) {
                    log.warn("Portfolio knowledge unavailable: {}", ex.getClass().getSimpleName());
                }
            }

            this.cachedKnowledge = "V.T.Thanh is a Software Engineer specializing in Spring Boot, Angular, and cloud-native solutions. Additional information: Final-year FCS student at Ho Chi Minh City Open University.";
            return this.cachedKnowledge;
        }
    }

    public void setCachedKnowledgeForTest(String content) {
        this.cachedKnowledge = content;
    }
}
