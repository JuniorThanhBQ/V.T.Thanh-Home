package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;

public record ChatMessageRequest(
    String message,
    String requestId,
    String turnstileToken
) {
    @JsonAnySetter
    public void rejectConversationSelector(String name, Object value) {
        if ("sessionToken".equals(name)) {
            throw new IllegalArgumentException("Conversation selection is managed by the server session");
        }
    }
}
