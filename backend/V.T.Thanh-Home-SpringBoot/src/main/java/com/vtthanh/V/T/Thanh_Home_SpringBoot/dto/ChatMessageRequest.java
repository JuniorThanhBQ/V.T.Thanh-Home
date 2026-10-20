package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

public record ChatMessageRequest(
    String sessionToken,
    String message,
    String requestId,
    String turnstileToken
) {
}
