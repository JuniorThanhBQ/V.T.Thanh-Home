package com.vtthanh.V.T.Thanh_Home_SpringBoot.dto;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ContactStatus;
import java.time.Instant;

public record ContactDetailResponse(
    Long id,
    String firstName,
    String lastName,
    String phone,
    String email,
    String subject,
    String message,
    ContactStatus status,
    int deliveryAttempts,
    Instant lastDeliveryAttempt,
    String lastDeliveryError,
    String ipAddress,
    Instant createdDate
) {
}
