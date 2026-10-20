package com.vtthanh.V.T.Thanh_Home_SpringBoot.controller;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.AdminLoginRequest;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.AdminSessionResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.AdminAuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    public AdminAuthController(AdminAuthService adminAuthService) {
        this.adminAuthService = adminAuthService;
    }

    @PostMapping("/login")
    public ResponseEntity<AdminSessionResponse> login(
            @RequestBody AdminLoginRequest loginRequest,
            HttpServletRequest request
    ) {
        AdminSessionResponse response = adminAuthService.login(
                loginRequest.username(),
                loginRequest.password(),
                request
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        adminAuthService.logout(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/session")
    public ResponseEntity<AdminSessionResponse> getSession() {
        return ResponseEntity.ok(adminAuthService.getSession());
    }
}
