package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

import java.time.Instant;

public record ContactReceiptResponse(
    Long id,
    String status,
    String message,
    Instant submittedAt
) {
}
