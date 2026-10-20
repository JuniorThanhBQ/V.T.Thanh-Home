package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

public record BlogChapterResponse(
    Long id,
    String title,
    String content,
    int chapterOrder
) {
}
