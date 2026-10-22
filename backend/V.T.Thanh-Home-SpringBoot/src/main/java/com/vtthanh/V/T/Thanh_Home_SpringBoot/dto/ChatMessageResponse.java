package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

import java.time.Instant;

public record ChatMessageResponse(
    Long messageId,
    String reply,
    Instant timestamp
) {
}
