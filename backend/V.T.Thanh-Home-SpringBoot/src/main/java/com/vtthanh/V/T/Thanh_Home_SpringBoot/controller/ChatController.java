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
    private final ChatStreamingService streaming;
    private final ChatRateLimiterService limiter;
    private final VisitorService visitors;
    private final TurnstileVerificationService turnstile;

    public ChatController(ChatService chat, VisitorService visitors, TurnstileVerificationService turnstile, ChatRateLimiterService limiter, ChatStreamingService streaming) {
        this.streaming = streaming;
        this.chat = chat;
        this.limiter = limiter;
        this.visitors = visitors;
        this.turnstile = turnstile;
    }

    @PostMapping("/session")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void startSession(@RequestBody(required = false) java.util.Map<String, String> body,
            HttpServletRequest request) {
        Long visitorId = visitors.requireVisitor(request);
        if (body != null && body.containsKey("sessionToken")) {
            throw new IllegalArgumentException("Conversation selection is managed by the server session");
        }
        limiter.checkLimit("chat-network:" + VisitorService.clientIp(request));
        turnstile.verifyToken(body == null ? null : body.get("turnstileToken"), VisitorService.clientIp(request), "chat");
        String token = chat.startNewSession(visitorId, VisitorService.clientIp(request), request.getHeader("User-Agent"));
        request.getSession().setAttribute("CHAT_TOKEN", token); // nosemgrep: java.lang.security.audit.tainted-session-from-http-request.tainted-session-from-http-request
    }

    @PostMapping("/message")
    public ChatMessageResponse sendMessage(@RequestBody ChatMessageRequest body, HttpServletRequest request) {
        Long visitorId = visitors.requireVisitor(request);
        limiter.checkLimit("chat-network:" + VisitorService.clientIp(request));
        String token = (String) request.getSession().getAttribute("CHAT_TOKEN");
        if (token == null) {
            turnstile.verifyToken(body.turnstileToken(), VisitorService.clientIp(request), "chat");
            token = chat.startNewSession(visitorId, VisitorService.clientIp(request), request.getHeader("User-Agent"));
            request.getSession().setAttribute("CHAT_TOKEN", token); // nosemgrep: java.lang.security.audit.tainted-session-from-http-request.tainted-session-from-http-request
        }
        return chat.sendMessage(body, visitorId, token);
    }

    @PostMapping(value = "/message/stream", produces = "text/event-stream")
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter streamMessage(
            @RequestBody ChatMessageRequest body, HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response) {
        Long visitorId = visitors.requireVisitor(request);
        limiter.checkLimit("chat-network:" + VisitorService.clientIp(request));
        String token = (String) request.getSession().getAttribute("CHAT_TOKEN");
        if (token == null) {
            turnstile.verifyToken(body.turnstileToken(), VisitorService.clientIp(request), "chat");
            token = chat.startNewSession(visitorId, VisitorService.clientIp(request), request.getHeader("User-Agent"));
            request.getSession().setAttribute("CHAT_TOKEN", token);
        }
        response.setHeader("Cache-Control", "private, no-store, no-transform");
        response.setHeader("X-Accel-Buffering", "no");
        return streaming.open(body, visitorId, token);
    }

    @GetMapping("/history")
    public List<ChatHistoryItemResponse> getHistory(HttpServletRequest request) {
        Long visitorId = visitors.requireVisitor(request);
        if (request.getParameterMap().containsKey("sessionToken")) {
            throw new IllegalArgumentException("Conversation selection is managed by the server session");
        }
        String token = (String) request.getSession().getAttribute("CHAT_TOKEN");
        return chat.getSessionHistory(token, visitorId);
    }
}
