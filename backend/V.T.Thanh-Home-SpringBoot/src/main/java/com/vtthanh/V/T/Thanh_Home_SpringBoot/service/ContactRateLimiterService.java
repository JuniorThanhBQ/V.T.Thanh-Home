package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.RateLimitExceededException;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ContactRateLimiterService {

    private static final int MAX_SUBMISSIONS = 5;
    private static final long WINDOW_SECONDS = 900;

    private final Map<String, IpSubmissionTracker> trackers = new ConcurrentHashMap<>();

    public void checkLimit(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            return;
        }

        Instant now = Instant.now();
        IpSubmissionTracker tracker = trackers.compute(clientIp, (key, existing) -> {
            if (existing == null || now.isAfter(existing.windowExpiresAt())) {
                return new IpSubmissionTracker(1, now.plusSeconds(WINDOW_SECONDS));
            }
            return new IpSubmissionTracker(existing.count() + 1, existing.windowExpiresAt());
        });

        if (tracker.count() > MAX_SUBMISSIONS) {
            throw new RateLimitExceededException("Too many contact submissions from this IP. Please wait before retrying.");
        }
    }

    public void resetForIp(String clientIp) {
        if (clientIp != null) {
            trackers.remove(clientIp);
        }
    }

    private record IpSubmissionTracker(int count, Instant windowExpiresAt) {
    }
}
