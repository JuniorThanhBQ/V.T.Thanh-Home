package com.vtthanh.V.T.Thanh_Home_SpringBoot.controller;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/chat/speech")
public class ChatSpeechController {
    private final ChatService chat;
    private final VisitorService visitors;
    private final ChatRateLimiterService limiter;
    private final GeminiSpeechService speech;
    private final SpeechStreamingService streams;
    private final boolean streamEnabled;

    public ChatSpeechController(ChatService chat, VisitorService visitors, ChatRateLimiterService limiter,
            GeminiSpeechService speech, SpeechStreamingService streams,
            @Value("${GEMINI_TTS_STREAM_ENABLED:true}") boolean streamEnabled) {
        this.chat = chat;
        this.visitors = visitors;
        this.limiter = limiter;
        this.speech = speech;
        this.streams = streams;
        this.streamEnabled = streamEnabled;
    }

    @PostMapping(value = "/{requestId}", produces = "audio/wav")
    public ResponseEntity<byte[]> speak(@PathVariable String requestId, HttpServletRequest request) {
        Reply reply = authorizedReply(requestId, request);
        return ResponseEntity.ok().header("Cache-Control", "private, no-store")
                .body(speech.generate(reply.cacheKey(), reply.text()));
    }

    @PostMapping(value = "/{requestId}/stream", produces = "text/event-stream")
    public ResponseEntity<SseEmitter> stream(@PathVariable String requestId, HttpServletRequest request) {
        if (!streamEnabled) {
            return ResponseEntity.status(501).header("Cache-Control", "private, no-store").build();
        }
        Reply reply = authorizedReply(requestId, request);
        return ResponseEntity.ok().header("Cache-Control", "private, no-store, no-transform")
                .body(streams.open(reply.cacheKey(), reply.text()));
    }

    private Reply authorizedReply(String requestId, HttpServletRequest request) {
        Long visitor = visitors.requireVisitor(request);
        limiter.checkLimit("speech:" + visitor);
        var session = request.getSession(false);
        String token = session == null ? null : (String) session.getAttribute("CHAT_TOKEN");
        String reply = chat.speechReply(token, visitor, requestId);
        return new Reply(visitor + ":" + token + ":" + requestId, reply);
    }

    private record Reply(String cacheKey, String text) { }
}
