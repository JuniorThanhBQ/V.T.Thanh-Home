package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class LoginRateLimiterService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_SECONDS = 900;

    private final ConcurrentHashMap<String, AttemptRecord> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        AttemptRecord record = attempts.get(key);
        if (record == null) {
            return false;
        }
        if (Instant.now().getEpochSecond() - record.firstAttemptEpoch() > WINDOW_SECONDS) {
            attempts.remove(key);
            return false;
        }
        return record.count().get() >= MAX_ATTEMPTS;
    }

    public void recordFailedAttempt(String key) {
        long now = Instant.now().getEpochSecond();
        attempts.compute(key, (k, existing) -> {
            if (existing == null || now - existing.firstAttemptEpoch() > WINDOW_SECONDS) {
                return new AttemptRecord(now, new AtomicInteger(1));
            }
            existing.count().incrementAndGet();
            return existing;
        });
    }

    public void reset(String key) {
        attempts.remove(key);
    }

    private record AttemptRecord(long firstAttemptEpoch, AtomicInteger count) {
    }
}
