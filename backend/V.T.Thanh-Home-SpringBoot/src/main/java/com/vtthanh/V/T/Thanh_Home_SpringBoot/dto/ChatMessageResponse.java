package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

import java.time.Instant;

public record ChatMessageResponse(
    Long messageId,
    String sessionToken,
    String reply,
    int tokensUsed,
    long latencyMs,
    Instant timestamp
) {
}
