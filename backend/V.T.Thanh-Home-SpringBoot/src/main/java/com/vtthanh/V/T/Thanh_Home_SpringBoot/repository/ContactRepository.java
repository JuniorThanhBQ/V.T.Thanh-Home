package com.vtthanh.V.T.Thanh_Home_SpringBoot.repository;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Contact;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ContactStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    @Modifying
    @Query("update Contact c set c.status = com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ContactStatus.FAILED, c.lastDeliveryError = 'Delivery attempt interrupted' where c.status = com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ContactStatus.PENDING and c.deliveryAttempts >= 3 and c.lastDeliveryAttempt < :cutoff")
    int expireClaims(@Param("cutoff") Instant cutoff);

    @Modifying(clearAutomatically = true)
    @Query("update Contact c set c.deliveryAttempts = c.deliveryAttempts + 1, c.lastDeliveryAttempt = :now where c.id = :id and c.status = com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ContactStatus.PENDING and c.deliveryAttempts < 3 and (c.lastDeliveryAttempt is null or c.lastDeliveryAttempt < :cutoff)")
    int claim(@Param("id") Long id, @Param("now") Instant now, @Param("cutoff") Instant cutoff);

    Optional<Contact> findByIdempotencyKey(String idempotencyKey);

    Optional<Contact> findByVisitorIdAndIdempotencyKey(Long visitorId, String idempotencyKey);

    List<Contact> findByStatusAndDeliveryAttemptsLessThanOrderByCreatedDateAsc(
            ContactStatus status,
            int maxAttempts,
            Pageable pageable
    );

    List<Contact> findAllByOrderByCreatedDateDesc();
}
