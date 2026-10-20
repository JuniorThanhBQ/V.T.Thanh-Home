package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

import java.util.List;

public record ProjectUpsertRequest(
    String slug,
    String label,
    String title,
    String subtitle,
    String description,
    List<String> techStack,
    String githubLink,
    String websiteLink,
    Integer displayOrder,
    Boolean published,
    Long version
) {
}
