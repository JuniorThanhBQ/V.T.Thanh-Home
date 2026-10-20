package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

public record AdminSessionResponse(
    boolean authenticated,
    String username
) {
}
