package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

import java.time.Instant;

public record ChatHistoryItemResponse(
    Long id,
    String input,
    String output,
    Instant timestamp
) {
}
