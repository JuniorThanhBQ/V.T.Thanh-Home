package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

public record ContactSubmissionRequest(
    String firstName,
    String lastName,
    String phone,
    String email,
    String subject,
    String service,
    String message,
    String turnstileToken,
    String idempotencyKey
) {
    public String resolveSubject() {
        if (subject != null && !subject.isBlank()) {
            return subject.trim();
        }
        if (service != null && !service.isBlank()) {
            return service.trim();
        }
        return "Portfolio Inquiry";
    }
}
