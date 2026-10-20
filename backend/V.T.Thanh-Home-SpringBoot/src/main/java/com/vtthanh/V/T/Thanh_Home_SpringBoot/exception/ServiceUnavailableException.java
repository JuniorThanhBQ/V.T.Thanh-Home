package com.vtthanh.V.T.Thanh_Home_SpringBoot.exception;

public class ServiceUnavailableException extends RuntimeException {
    public ServiceUnavailableException(String message) {
        super(message);
    }
}
