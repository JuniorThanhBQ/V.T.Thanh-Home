package com.vtthanh.V.T.Thanh_Home_SpringBoot.controller;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ContactReceiptResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ContactSubmissionRequest;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.ContactService;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.VisitorService;
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

    private final VisitorService visitors;

    public ContactController(ContactService contactService, VisitorService visitors) {
        this.contactService = contactService;
        this.visitors = visitors;
    }

    @PostMapping
    public ResponseEntity<ContactReceiptResponse> submitContact(
            @RequestBody ContactSubmissionRequest request,
            HttpServletRequest servletRequest
    ) {
        Long visitorId = visitors.requireVisitor(servletRequest);
        String clientIp = VisitorService.clientIp(servletRequest);
        String userAgent = VisitorService.bounded(servletRequest.getHeader("User-Agent"), 300);

        ContactReceiptResponse receipt = contactService.submitContact(request, clientIp, userAgent, visitorId);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(receipt);
    }

}
