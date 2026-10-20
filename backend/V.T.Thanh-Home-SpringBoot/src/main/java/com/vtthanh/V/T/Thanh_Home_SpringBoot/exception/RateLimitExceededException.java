package com.vtthanh.V.T.Thanh_Home_SpringBoot.exception;

public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String message) {
        super(message);
    }
}
