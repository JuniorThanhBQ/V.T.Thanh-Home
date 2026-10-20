package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

import java.time.Instant;
import java.util.List;

public record ProjectResponse(
    Long id,
    String slug,
    String label,
    String title,
    String subtitle,
    String description,
    List<String> techStack,
    String githubLink,
    String websiteLink,
    int displayOrder,
    boolean published,
    Long version,
    Instant createdDate,
    Instant updatedDate
) {
}
