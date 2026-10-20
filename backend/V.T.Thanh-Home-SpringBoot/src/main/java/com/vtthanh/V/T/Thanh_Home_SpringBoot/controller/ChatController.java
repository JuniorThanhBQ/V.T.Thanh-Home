package com.vtthanh.V.T.Thanh_Home_SpringBoot.controller;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.*;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {
    private final ChatService chat;
    private final ChatRateLimiterService limiter;
    private final VisitorService visitors;
    private final TurnstileVerificationService turnstile;

    public ChatController(ChatService chat, VisitorService visitors, TurnstileVerificationService turnstile, ChatRateLimiterService limiter) {
        this.chat = chat;
        this.limiter = limiter;
        this.visitors = visitors;
        this.turnstile = turnstile;
    }

    @PostMapping("/session")
    public ChatSessionResponse startSession(@RequestBody(required = false) java.util.Map<String, String> body,
            HttpServletRequest request) {
        Long visitorId = visitors.requireVisitor(request);
        limiter.checkLimit("chat-network:" + VisitorService.clientIp(request));
        turnstile.verifyToken(body == null ? null : body.get("turnstileToken"), VisitorService.clientIp(request), "chat");
        ChatSessionResponse session = chat.startNewSession(visitorId, VisitorService.clientIp(request), request.getHeader("User-Agent"));
        request.getSession().setAttribute("CHAT_TOKEN", session.sessionToken()); // nosemgrep: java.lang.security.audit.tainted-session-from-http-request.tainted-session-from-http-request
        return session;
    }

    @PostMapping("/message")
    public ChatMessageResponse sendMessage(@RequestBody ChatMessageRequest body, HttpServletRequest request) {
        Long visitorId = visitors.requireVisitor(request);
        limiter.checkLimit("chat-network:" + VisitorService.clientIp(request));
        String token = body.sessionToken();
        if (token == null || token.isBlank()) {
            token = (String) request.getSession().getAttribute("CHAT_TOKEN");
        }
        if (token == null) {
            turnstile.verifyToken(body.turnstileToken(), VisitorService.clientIp(request), "chat");
            ChatSessionResponse created = chat.startNewSession(visitorId, VisitorService.clientIp(request), request.getHeader("User-Agent"));
            token = created.sessionToken();
            request.getSession().setAttribute("CHAT_TOKEN", token); // nosemgrep: java.lang.security.audit.tainted-session-from-http-request.tainted-session-from-http-request
        }
        return chat.sendMessage(body, visitorId, token);
    }

    @GetMapping("/history")
    public List<ChatHistoryItemResponse> getHistory(@RequestParam(required = false) String sessionToken,
            HttpServletRequest request) {
        Long visitorId = visitors.requireVisitor(request);
        String token = sessionToken == null ? (String) request.getSession().getAttribute("CHAT_TOKEN") : sessionToken;
        return chat.getSessionHistory(token, visitorId);
    }
}
