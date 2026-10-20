package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class LoginRateLimiterService {

    private static final int MAX_ATTEMPTS = 5;
    private static final int MAX_IP_ATTEMPTS = 20;
    private static final long WINDOW_SECONDS = 900;
    private static final int MAX_ENTRIES = 10000;

    private final ConcurrentHashMap<String, AttemptRecord> attempts = new ConcurrentHashMap<>();

    public synchronized boolean tryAcquire(String clientIp, String username) {
        long now = Instant.now().getEpochSecond();
        String ipKey = "ip:" + clientIp;
        String userKey = "user:" + clientIp + ":" + (username != null ? username : "");

        cleanupExpired(now);

        if (attempts.size() >= MAX_ENTRIES && (!attempts.containsKey(ipKey) || !attempts.containsKey(userKey))) {
            return false;
        }

        if (isKeyBlocked(ipKey, MAX_IP_ATTEMPTS, now) || isKeyBlocked(userKey, MAX_ATTEMPTS, now)) {
            return false;
        }

        incrementKey(ipKey, now);
        incrementKey(userKey, now);
        return true;
    }

    public synchronized void reset(String clientIp, String username) {
        String userKey = "user:" + clientIp + ":" + (username != null ? username : "");
        attempts.remove(userKey);
    }

    public synchronized boolean isBlocked(String key) {
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

    public synchronized void recordFailedAttempt(String key) {
        long now = Instant.now().getEpochSecond();
        incrementKey(key, now);
    }

    public synchronized void reset(String key) {
        attempts.remove(key);
    }

    @Scheduled(fixedDelay = 60000)
    public synchronized void expireWindows() {
        long now = Instant.now().getEpochSecond();
        attempts.entrySet().removeIf(entry -> now - entry.getValue().firstAttemptEpoch() > WINDOW_SECONDS);
    }

    private boolean isKeyBlocked(String key, int maxAllowed, long now) {
        AttemptRecord record = attempts.get(key);
        if (record == null) {
            return false;
        }
        if (now - record.firstAttemptEpoch() > WINDOW_SECONDS) {
            attempts.remove(key);
            return false;
        }
        return record.count().get() >= maxAllowed;
    }

    private void incrementKey(String key, long now) {
        attempts.compute(key, (k, existing) -> {
            if (existing == null || now - existing.firstAttemptEpoch() > WINDOW_SECONDS) {
                return new AttemptRecord(now, new AtomicInteger(1));
            }
            existing.count().incrementAndGet();
            return existing;
        });
    }

    private void cleanupExpired(long now) {
        if (attempts.size() >= MAX_ENTRIES) {
            attempts.entrySet().removeIf(entry -> now - entry.getValue().firstAttemptEpoch() > WINDOW_SECONDS);
        }
    }

    private record AttemptRecord(long firstAttemptEpoch, AtomicInteger count) {
    }
}
