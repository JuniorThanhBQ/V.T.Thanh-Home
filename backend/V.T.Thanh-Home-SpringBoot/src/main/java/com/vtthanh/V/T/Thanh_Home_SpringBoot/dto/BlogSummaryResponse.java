package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.BlogCategory;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.BlogStatus;
import java.time.Instant;

public record BlogSummaryResponse(
    Long id,
    String slug,
    String title,
    String subtitle,
    String description,
    BlogCategory category,
    String bannerUrl,
    BlogStatus status,
    Instant publishedAt,
    Long version,
    Instant createdDate
) {
}
