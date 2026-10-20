package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.BlogCategory;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.BlogStatus;
import java.util.List;

public record BlogUpsertRequest(
    String slug,
    String title,
    String subtitle,
    String description,
    BlogCategory category,
    String bannerUrl,
    BlogStatus status,
    List<BlogChapterRequest> chapters,
    Long version
) {
}
