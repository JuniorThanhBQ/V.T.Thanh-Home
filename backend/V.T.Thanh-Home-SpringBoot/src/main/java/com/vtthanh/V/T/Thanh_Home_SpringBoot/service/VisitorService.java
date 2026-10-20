package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.VisitorRequest;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Visitor;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.VisitorRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;

@Service
public class VisitorService {

    private static final String VISITOR_ID = "VISITOR_ID";
    private final VisitorRepository repository;
    private final ChatRateLimiterService limiter;
    private final TransactionTemplate transactions;

    public VisitorService(VisitorRepository repository, PlatformTransactionManager manager, ChatRateLimiterService limiter) {
        this.repository = repository;
        this.limiter = limiter;
        this.transactions = new TransactionTemplate(manager);
    }

    public void register(HttpServletRequest request, VisitorRequest metadata) {
        if (metadata == null || length(metadata.language()) > 40 || length(metadata.timeZone()) > 100) {
            throw new IllegalArgumentException("Visitor metadata is invalid");
        }
        HttpSession existingSession = request.getSession(false);
        if (existingSession == null || existingSession.getAttribute(VISITOR_ID) == null) {
            limiter.checkLimit("registration:" + clientIp(request));
        }
        HttpSession session = request.getSession(true);
        synchronized (session) {
            Long id = (Long) session.getAttribute(VISITOR_ID);
            Long savedId = transactions.execute(status -> {
                Visitor visitor = id == null ? null : repository.findById(id).orElse(null);
                if (visitor == null) {
                    visitor = new Visitor(UUID.randomUUID(), clientIp(request));
                }
                if (visitor.isBlocked()) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Visitor access denied");
                }
                visitor.updateLastSeen();
                visitor.setMetadata(bounded(request.getHeader("User-Agent"), 300), metadata.language(), metadata.timeZone());
                return repository.save(visitor).getId();
            });
            session.setAttribute(VISITOR_ID, savedId);
        }
    }

    public Long requireVisitor(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Long id = session == null ? null : (Long) session.getAttribute(VISITOR_ID);
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Visitor session required");
        }
        Visitor visitor = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Visitor session expired"));
        if (visitor.isBlocked()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Visitor access denied");
        }
        return id;
    }

    public static String clientIp(HttpServletRequest request) {
        return bounded(request.getRemoteAddr(), 45);
    }

    public static String bounded(String value, int max) {
        return value == null ? null : value.substring(0, Math.min(value.length(), max));
    }

    private static int length(String value) {
        return value == null ? 0 : value.length();
    }
}
