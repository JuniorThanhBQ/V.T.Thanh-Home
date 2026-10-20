package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

public record BlogChapterRequest(
    String title,
    String content,
    int chapterOrder
) {
}
