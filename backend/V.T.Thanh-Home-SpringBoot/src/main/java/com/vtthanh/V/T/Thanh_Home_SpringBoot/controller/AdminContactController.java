package com.vtthanh.V.T.Thanh_Home_SpringBoot.controller;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ContactDetailResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.ContactService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/contacts")
public class AdminContactController {

    private final ContactService contactService;

    public AdminContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @GetMapping
    public ResponseEntity<List<ContactDetailResponse>> getAllContacts() {
        return ResponseEntity.ok(contactService.getAllContactsForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContactDetailResponse> getContactById(@PathVariable Long id) {
        return ResponseEntity.ok(contactService.getContactByIdForAdmin(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id) {
        contactService.deleteContactForAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
