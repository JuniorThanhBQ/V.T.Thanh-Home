package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.RateLimitExceededException;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatRateLimiterService {

    private static final int MAX_REQUESTS = 20;
    private static final long WINDOW_SECONDS = 600;

    private final Map<String, WindowTracker> trackers = new ConcurrentHashMap<>();

    public void checkLimit(String clientKey) {
        if (clientKey == null || clientKey.isBlank()) {
            return;
        }

        if (trackers.size() >= 10000 && !trackers.containsKey(clientKey)) {
            throw new RateLimitExceededException("Request capacity reached. Please retry later.");
        }
        Instant now = Instant.now();
        WindowTracker tracker = trackers.compute(clientKey, (k, existing) -> {
            if (existing == null || now.isAfter(existing.expiresAt())) {
                return new WindowTracker(1, now.plusSeconds(WINDOW_SECONDS));
            }
            return new WindowTracker(existing.count() + 1, existing.expiresAt());
        });

        if (tracker.count() > MAX_REQUESTS) {
            throw new RateLimitExceededException("Chat rate limit exceeded. Please wait a few moments before sending more messages.");
        }
    }

    public void reset(String clientKey) {
        if (clientKey != null) {
            trackers.remove(clientKey);
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 60000)
    public void expireWindows() {
        Instant now = Instant.now();
        trackers.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt()));
    }

    private record WindowTracker(int count, Instant expiresAt) {
    }
}
