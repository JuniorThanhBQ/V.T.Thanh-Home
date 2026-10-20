package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.AdminSessionResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.AdminAccount;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.RateLimitExceededException;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.AdminAccountRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AdminAuthService {

    private static final Logger log = LoggerFactory.getLogger(AdminAuthService.class);

    private final AdminAccountRepository adminAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginRateLimiterService rateLimiterService;

    public AdminAuthService(
            AdminAccountRepository adminAccountRepository,
            PasswordEncoder passwordEncoder,
            LoginRateLimiterService rateLimiterService
    ) {
        this.adminAccountRepository = adminAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.rateLimiterService = rateLimiterService;
    }

    public AdminSessionResponse login(String username, String password, HttpServletRequest request) {
        if (username == null || username.isBlank() || username.length() > 50
                || password == null || password.isBlank() || password.length() > 512) {
            throw new BadCredentialsException("Invalid credentials");
        }
        String clientIp = resolveClientIp(request);
        String rateLimitKey = clientIp + ":" + (username != null ? username : "");

        if (rateLimiterService.isBlocked(rateLimitKey)) {
            log.warn("Login attempt blocked by rate limit for client: {}", clientIp);
            throw new RateLimitExceededException("Too many failed login attempts. Please try again later.");
        }

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            rateLimiterService.recordFailedAttempt(rateLimitKey);
            throw new BadCredentialsException("Invalid credentials");
        }

        AdminAccount admin = adminAccountRepository.findByUsername(username)
                .orElse(null);

        if (admin == null || !admin.isActive() || !passwordEncoder.matches(password, admin.getPasswordHash())) {
            rateLimiterService.recordFailedAttempt(rateLimitKey);
            log.warn("Administrator authentication failed");
            throw new BadCredentialsException("Invalid credentials");
        }

        rateLimiterService.reset(rateLimitKey);

        HttpSession session = request.getSession(false);
        if (session != null) {
            request.changeSessionId();
        } else {
            session = request.getSession(true);
        }

        List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(admin.getUsername(), null, authorities);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        log.info("Administrator logged in successfully: {}", admin.getUsername());
        return new AdminSessionResponse(true, admin.getUsername());
    }

    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        log.info("Administrator logged out successfully");
    }

    public AdminSessionResponse getSession() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !("anonymousUser".equals(auth.getName()))) {
            return new AdminSessionResponse(true, auth.getName());
        }
        return new AdminSessionResponse(false, null);
    }

    private String resolveClientIp(HttpServletRequest request) {
        return VisitorService.clientIp(request);
    }
}
