package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Contact;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ContactStatus;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.ContactRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;

@Service
public class ContactNotificationWorker {

    private static final Logger log = LoggerFactory.getLogger(ContactNotificationWorker.class);
    private static final int MAX_ATTEMPTS = 3;
    private static final int BATCH_SIZE = 10;

    private final ContactRepository contactRepository;
    private final GmailRestEmailService emailService;

    public ContactNotificationWorker(
            ContactRepository contactRepository,
            GmailRestEmailService emailService
    ) {
        this.contactRepository = contactRepository;
        this.emailService = emailService;
    }

    @Async
    public void processContactAsync(Long contactId) {
        processSingleContact(contactId);
    }

    @Scheduled(fixedDelay = 30000)
    public void processPendingNotifications() {
        List<Contact> pending = contactRepository.findByStatusAndDeliveryAttemptsLessThanOrderByCreatedDateAsc(
                ContactStatus.PENDING,
                MAX_ATTEMPTS,
                PageRequest.of(0, BATCH_SIZE)
        );

        for (Contact contact : pending) {
            processSingleContact(contact.getId());
        }
    }

    public void processSingleContact(Long contactId) {
        Contact contact = contactRepository.findById(contactId).orElse(null);
        if (contact == null || contact.getStatus() != ContactStatus.PENDING || contact.getDeliveryAttempts() >= MAX_ATTEMPTS) {
            return;
        }

        try {
            emailService.sendContactNotification(contact);
            markSuccess(contactId);
        } catch (Exception ex) {
            log.error("Failed delivering email notification for contact id={}: {}", contactId, ex.getMessage());
            markFailure(contactId, ex.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markSuccess(Long contactId) {
        contactRepository.findById(contactId).ifPresent(c -> {
            c.setStatus(ContactStatus.SENT);
            c.setDeliveryAttempts(c.getDeliveryAttempts() + 1);
            c.setLastDeliveryAttempt(Instant.now());
            c.setLastDeliveryError(null);
            contactRepository.save(c);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailure(Long contactId, String errorMessage) {
        contactRepository.findById(contactId).ifPresent(c -> {
            int newAttempts = c.getDeliveryAttempts() + 1;
            c.setDeliveryAttempts(newAttempts);
            c.setLastDeliveryAttempt(Instant.now());
            c.setLastDeliveryError(errorMessage);
            if (newAttempts >= MAX_ATTEMPTS) {
                c.setStatus(ContactStatus.FAILED);
            }
            contactRepository.save(c);
        });
    }
}
