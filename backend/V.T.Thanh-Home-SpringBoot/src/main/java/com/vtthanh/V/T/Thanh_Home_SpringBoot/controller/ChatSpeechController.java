package com.vtthanh.V.T.Thanh_Home_SpringBoot.controller;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chat/speech")
public class ChatSpeechController {
    private final ChatService chat;
    private final VisitorService visitors;
    private final ChatRateLimiterService limiter;
    private final GeminiSpeechService speech;

    public ChatSpeechController(ChatService chat, VisitorService visitors, ChatRateLimiterService limiter, GeminiSpeechService speech) {
        this.chat = chat;
        this.visitors = visitors;
        this.limiter = limiter;
        this.speech = speech;
    }

    @PostMapping(value = "/{requestId}", produces = "audio/wav")
    public ResponseEntity<byte[]> speak(@PathVariable String requestId, HttpServletRequest request) {
        Long visitor = visitors.requireVisitor(request);
        limiter.checkLimit("speech:" + visitor);
        var session = request.getSession(false);
        String token = session == null ? null : (String) session.getAttribute("CHAT_TOKEN");
        String reply = chat.speechReply(token, visitor, requestId);
        return ResponseEntity.ok().header("Cache-Control", "private, no-store")
                .body(speech.generate(visitor + ":" + requestId, reply));
    }
}
