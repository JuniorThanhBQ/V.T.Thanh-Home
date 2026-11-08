package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.RateLimitExceededException;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ServiceUnavailableException;
import jakarta.annotation.PreDestroy;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class SpeechStreamingService {
    private final GeminiSpeechService speech;
    private final ExecutorService workers = new ThreadPoolExecutor(0, 4, 30, TimeUnit.SECONDS,
            new SynchronousQueue<>(), Thread.ofVirtual().name("speech-stream-", 0).factory());
    private final ScheduledThreadPoolExecutor clock = new ScheduledThreadPoolExecutor(2);

    public SpeechStreamingService(GeminiSpeechService speech) {
        this.speech = speech;
        clock.setRemoveOnCancelPolicy(true);
    }

    public SseEmitter open(String id, String reply) {
        var emitter = new SseEmitter(45000L);
        var finished = new AtomicBoolean();
        var worker = new FutureTask<Void>(() -> {
            try {
                send(emitter, Map.of("type", "start", "format", "s16le", "rate", 24000, "channels", 1));
                int[] sequence = {0};
                speech.stream(id, reply, chunk -> send(emitter, Map.of("type", "audio", "seq", sequence[0]++,
                        "data", Base64.getEncoder().encodeToString(chunk))));
                send(emitter, Map.of("type", "done", "chunks", sequence[0]));
                emitter.complete();
            } catch (UncheckedIOException | IllegalStateException ex) {
                if (!Thread.currentThread().isInterrupted()) {
                    emitter.complete();
                }
            } catch (RuntimeException ex) {
                if (!Thread.currentThread().isInterrupted()) {
                    try {
                        send(emitter, Map.of("type", "error", "status", ex instanceof RateLimitExceededException ? 429 : 503));
                        emitter.complete();
                    } catch (UncheckedIOException | IllegalStateException failure) {
                        emitter.complete();
                    }
                }
            } finally {
                finished.set(true);
            }
            return null;
        });
        var heartbeat = clock.scheduleAtFixedRate(() -> {
            if (finished.get()) {
                return;
            }
            try {
                emitter.send(SseEmitter.event().comment("heartbeat"));
            } catch (IOException | IllegalStateException ex) {
                worker.cancel(true);
            }
        }, 2, 2, TimeUnit.SECONDS);
        Runnable cancel = () -> {
            heartbeat.cancel(true);
            if (!finished.get()) {
                worker.cancel(true);
            }
        };
        emitter.onCompletion(cancel);
        emitter.onTimeout(cancel);
        emitter.onError(error -> cancel.run());
        try {
            workers.execute(() -> {
                try {
                    worker.run();
                } finally {
                    heartbeat.cancel(false);
                }
            });
        } catch (RejectedExecutionException ex) {
            cancel.run();
            throw new ServiceUnavailableException("Speech is busy. Please try again.");
        }
        return emitter;
    }

    private static void send(SseEmitter emitter, Map<String, ?> frame) {
        if (Thread.currentThread().isInterrupted()) {
            throw new CancellationException();
        }
        try {
            emitter.send(SseEmitter.event().data(frame, MediaType.APPLICATION_JSON));
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    @PreDestroy
    void shutdown() {
        workers.shutdownNow();
        clock.shutdownNow();
    }
}
