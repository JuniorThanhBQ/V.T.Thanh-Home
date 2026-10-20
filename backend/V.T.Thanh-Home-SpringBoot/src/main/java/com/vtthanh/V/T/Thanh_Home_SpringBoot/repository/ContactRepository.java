package com.vtthanh.V.T.Thanh_Home_SpringBoot.repository;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Contact;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ContactStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    Optional<Contact> findByIdempotencyKey(String idempotencyKey);

    List<Contact> findByStatusAndDeliveryAttemptsLessThanOrderByCreatedDateAsc(
            ContactStatus status,
            int maxAttempts,
            Pageable pageable
    );

    List<Contact> findAllByOrderByCreatedDateDesc();
}
