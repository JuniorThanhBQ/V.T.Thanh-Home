package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ContactDetailResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ContactReceiptResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ContactSubmissionRequest;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Contact;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ResourceNotFoundException;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.ContactRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class ContactService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final ContactRepository contactRepository;
    private final ContactRateLimiterService rateLimiterService;
    private final TurnstileVerificationService turnstileService;
    private final ContactNotificationWorker notificationWorker;

    public ContactService(
            ContactRepository contactRepository,
            ContactRateLimiterService rateLimiterService,
            TurnstileVerificationService turnstileService,
            ContactNotificationWorker notificationWorker
    ) {
        this.contactRepository = contactRepository;
        this.rateLimiterService = rateLimiterService;
        this.turnstileService = turnstileService;
        this.notificationWorker = notificationWorker;
    }

    @Transactional
    public ContactReceiptResponse submitContact(ContactSubmissionRequest req, String clientIp, String userAgent) {
        rateLimiterService.checkLimit(clientIp);

        turnstileService.verifyToken(req.turnstileToken(), clientIp);

        validateSubmission(req);

        if (req.idempotencyKey() != null && !req.idempotencyKey().isBlank()) {
            var existing = contactRepository.findByIdempotencyKey(req.idempotencyKey().trim());
            if (existing.isPresent()) {
                Contact c = existing.get();
                return new ContactReceiptResponse(c.getId(), "RECEIVED", "Contact message received successfully", c.getCreatedDate());
            }
        }

        String resolvedSubject = req.resolveSubject();
        Contact contact = new Contact(
                req.firstName().trim(),
                req.email().trim(),
                resolvedSubject,
                req.message().trim()
        );

        if (req.lastName() != null && !req.lastName().isBlank()) {
            contact.setLastName(req.lastName().trim());
        }
        if (req.phone() != null && !req.phone().isBlank()) {
            contact.setPhone(req.phone().trim());
        }
        if (req.idempotencyKey() != null && !req.idempotencyKey().isBlank()) {
            contact.setIdempotencyKey(req.idempotencyKey().trim());
        }
        contact.setIpAddress(clientIp);
        contact.setUserAgent(userAgent);

        Contact saved = contactRepository.save(contact);

        notificationWorker.processContactAsync(saved.getId());

        return new ContactReceiptResponse(
                saved.getId(),
                "RECEIVED",
                "Contact message received successfully",
                saved.getCreatedDate()
        );
    }

    @Transactional(readOnly = true)
    public List<ContactDetailResponse> getAllContactsForAdmin() {
        return contactRepository.findAllByOrderByCreatedDateDesc()
                .stream()
                .map(this::mapToDetail)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContactDetailResponse getContactByIdForAdmin(Long id) {
        return contactRepository.findById(id)
                .map(this::mapToDetail)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with id: " + id));
    }

    @Transactional
    public void deleteContactForAdmin(Long id) {
        if (!contactRepository.existsById(id)) {
            throw new ResourceNotFoundException("Contact not found with id: " + id);
        }
        contactRepository.deleteById(id);
    }

    private void validateSubmission(ContactSubmissionRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Contact request body is required");
        }

        if (req.firstName() == null || req.firstName().trim().length() < 2 || req.firstName().trim().length() > 100) {
            throw new IllegalArgumentException("First name must be between 2 and 100 characters");
        }

        if (req.lastName() != null && req.lastName().trim().length() > 50) {
            throw new IllegalArgumentException("Last name cannot exceed 50 characters");
        }

        if (req.phone() != null && req.phone().trim().length() > 30) {
            throw new IllegalArgumentException("Phone number cannot exceed 30 characters");
        }

        if (req.email() == null || req.email().trim().length() > 255 || !EMAIL_PATTERN.matcher(req.email().trim()).matches()) {
            throw new IllegalArgumentException("A valid email address is required");
        }

        if (req.message() == null || req.message().trim().length() < 10 || req.message().trim().length() > 1000) {
            throw new IllegalArgumentException("Message must be between 10 and 1000 characters");
        }
    }

    private ContactDetailResponse mapToDetail(Contact c) {
        return new ContactDetailResponse(
                c.getId(),
                c.getFirstName(),
                c.getLastName(),
                c.getPhone(),
                c.getEmail(),
                c.getSubject(),
                c.getMessage(),
                c.getStatus(),
                c.getDeliveryAttempts(),
                c.getLastDeliveryAttempt(),
                c.getLastDeliveryError(),
                c.getIpAddress(),
                c.getCreatedDate()
        );
    }
}
