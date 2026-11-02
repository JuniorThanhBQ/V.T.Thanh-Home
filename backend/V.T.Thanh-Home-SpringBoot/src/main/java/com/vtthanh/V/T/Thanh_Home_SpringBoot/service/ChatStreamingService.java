package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ChatMessageRequest;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class ChatStreamingService {
    private final ChatService chat;
    private final ExecutorService workers = Executors.newVirtualThreadPerTaskExecutor();
    private final ScheduledExecutorService clock = Executors.newScheduledThreadPool(2);
    private final Semaphore streams = new Semaphore(2);

    public ChatStreamingService(ChatService chat) {
        this.chat = chat;
    }

    public SseEmitter open(ChatMessageRequest body, Long visitorId, String token) {
        chat.validateStream(body, visitorId, token);
        if (!streams.tryAcquire()) {
            throw new com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ServiceUnavailableException("The assistant is busy");
        }
        var emitter = new SseEmitter(55000L);
        var stopped = new AtomicBoolean();
        var task = new FutureTask<Void>(() -> {
            try {
                send(emitter, "start", Map.of("requestId", body.requestId()));
                var result = chat.sendMessage(body, visitorId, token, text -> {
                    if (stopped.get()) {
                        throw new CancellationException();
                    }
                    send(emitter, "delta", Map.of("text", text));
                }, stage -> {
                    if (stopped.get()) {
                        throw new CancellationException();
                    }
                    send(emitter, "status", Map.of("stage", stage));
                });
                if (!stopped.get()) {
                    send(emitter, "done", result);
                }
                emitter.complete();
            } catch (RuntimeException ex) {
                if (!stopped.get()) {
                    try {
                        int status = ex instanceof org.springframework.web.server.ResponseStatusException response ? response.getStatusCode().value() : 503;
                        send(emitter, "error", Map.of("status", status));
                        emitter.complete();
                    } catch (RuntimeException failure) {
                        emitter.completeWithError(failure);
                    }
                }
            }
            return null;
        });
        var heartbeat = clock.scheduleAtFixedRate(() -> {
            try {
                emitter.send(SseEmitter.event().comment("heartbeat"));
            } catch (IOException | IllegalStateException ex) {
                stopped.set(true);
                task.cancel(true);
                emitter.completeWithError(ex);
            }
        }, 10, 10, TimeUnit.SECONDS);
        var deadline = clock.schedule(() -> {
            stopped.set(true);
            task.cancel(true);
            emitter.complete();
        }, 50, TimeUnit.SECONDS);
        Runnable stop = () -> {
            stopped.set(true);
            task.cancel(true);
            heartbeat.cancel(false);
            deadline.cancel(false);
        };
        emitter.onCompletion(stop);
        emitter.onTimeout(stop);
        emitter.onError(error -> stop.run());
        workers.execute(() -> {
            try {
                task.run();
            } finally {
                streams.release();
            }
        });
        return emitter;
    }

    private static void send(SseEmitter emitter, String event, Object data) {
        try {
            emitter.send(SseEmitter.event().name(event).data(data));
        } catch (IOException ex) {
            throw new java.io.UncheckedIOException(ex);
        }
    }

    @PreDestroy
    public void close() {
        clock.shutdownNow();
        workers.shutdownNow();
    }
}
