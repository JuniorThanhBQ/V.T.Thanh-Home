package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Contact;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ContactStatus;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.ContactRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.Instant;
import java.util.List;

@Service
public class ContactNotificationWorker {
    private final ContactRepository contacts;
    private final GmailRestEmailService email;
    private final TransactionTemplate transactions;
    private final boolean enabled;

    public ContactNotificationWorker(ContactRepository contacts, GmailRestEmailService email,
            PlatformTransactionManager manager, @Value("${app.mail.worker-enabled:true}") boolean enabled) {
        this.contacts = contacts;
        this.email = email;
        this.transactions = new TransactionTemplate(manager);
        this.enabled = enabled;
    }

    @Scheduled(fixedDelay = 30000)
    public void processPendingNotifications() {
        if (!enabled) {
            return;
        }
        transactions.executeWithoutResult(tx -> contacts.expireClaims(Instant.now().minusSeconds(90)));
        if (!email.isConfigured()) {
            return;
        }
        List<Contact> pending = contacts.findByStatusAndDeliveryAttemptsLessThanOrderByCreatedDateAsc(
                ContactStatus.PENDING, 3, PageRequest.of(0, 10));
        for (Contact contact : pending) {
            processSingleContact(contact.getId());
        }
    }

    public void processSingleContact(Long id) {
        Contact claimed = transactions.execute(tx -> {
            Instant now = Instant.now();
            if (contacts.claim(id, now, now.minusSeconds(90)) == 0) {
                return null;
            }
            return contacts.findById(id).orElse(null);
        });
        if (claimed == null) {
            return;
        }
        boolean sent;
        try {
            email.sendContactNotification(claimed);
            sent = true;
        } catch (RuntimeException ex) {
            sent = false;
        }
        boolean accepted = sent;
        transactions.executeWithoutResult(tx -> contacts.findById(id).ifPresent(contact -> {
            contact.setStatus(accepted ? ContactStatus.SENT
                    : contact.getDeliveryAttempts() >= 3 ? ContactStatus.FAILED : ContactStatus.PENDING);
            contact.setLastDeliveryError(accepted ? null : "Email provider unavailable");
            contacts.save(contact);
        }));
    }
}
