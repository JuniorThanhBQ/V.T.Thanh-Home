package com.vtthanh.V.T.Thanh_Home_SpringBoot.controller;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.VisitorRequest;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.VisitorService;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.TurnstileVerificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class VisitorController {

    private final VisitorService visitors;

    private final TurnstileVerificationService turnstile;

    public VisitorController(VisitorService visitors, TurnstileVerificationService turnstile) {
        this.visitors = visitors;
        this.turnstile = turnstile;
    }

    @GetMapping("/api/v1/security/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    @GetMapping("/api/v1/security/config")
    public Map<String, String> config() {
        return Map.of("turnstileSiteKey", turnstile.publicSiteKey());
    }

    @PostMapping("/api/v1/visitors")
    public Map<String, Boolean> register(@RequestBody VisitorRequest metadata, HttpServletRequest request) {
        visitors.register(request, metadata);
        return Map.of("registered", true);
    }
}
