package com.vtthanh.V.T.Thanh_Home_SpringBoot.controller;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ContactReceiptResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ContactSubmissionRequest;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.ContactService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/contacts")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    public ResponseEntity<ContactReceiptResponse> submitContact(
            @RequestBody ContactSubmissionRequest request,
            HttpServletRequest servletRequest
    ) {
        String clientIp = resolveClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");

        ContactReceiptResponse receipt = contactService.submitContact(request, clientIp, userAgent);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(receipt);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
