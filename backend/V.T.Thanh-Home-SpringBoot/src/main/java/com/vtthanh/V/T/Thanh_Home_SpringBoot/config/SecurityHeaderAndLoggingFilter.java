package com.vtthanh.V.T.Thanh_Home_SpringBoot.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeaderAndLoggingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(SecurityHeaderAndLoggingFilter.class);
    private static final Pattern SAFE_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{1,64}$");

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long startTime = System.currentTimeMillis();
        String rawRequestId = request.getHeader("X-Request-Id");
        String requestId;
        if (rawRequestId != null && SAFE_ID_PATTERN.matcher(rawRequestId).matches()) {
            requestId = rawRequestId;
        } else {
            requestId = UUID.randomUUID().toString();
        }
        response.setHeader("X-Request-Id", requestId);
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            String safeMethod = sanitizeLogInput(request.getMethod());
            String safeUri = sanitizeLogInput(request.getRequestURI());
            log.info("[{}] {} {} -> Status: {} ({}ms)",
                    requestId,
                    safeMethod,
                    safeUri,
                    response.getStatus(),
                    duration
            );
        }
    }

    private String sanitizeLogInput(String input) {
        if (input == null) {
            return "";
        }
        return input.replaceAll("[\r\n\t]", "_");
    }
}
