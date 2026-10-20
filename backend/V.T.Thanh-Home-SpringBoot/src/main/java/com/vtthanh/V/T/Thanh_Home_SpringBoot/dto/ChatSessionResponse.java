package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

import java.time.Instant;

public record ChatSessionResponse(
    String sessionToken,
    Instant createdDate
) {
}
