package com.vtthanh.V.T.Thanh_Home_SpringBoot;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.LoginRateLimiterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.assertThat;

class LoginRateLimiterServiceTest {

    private LoginRateLimiterService limiter;

    @BeforeEach
    void setUp() {
        limiter = new LoginRateLimiterService();
    }

    @Test
    void allowsUpToMaxAttemptsPerUserAndBlocksSubsequent() {
        String ip = "192.168.1.10";
        String user = "admin";

        for (int i = 0; i < 5; i++) {
            assertThat(limiter.tryAcquire(ip, user)).isTrue();
        }
        assertThat(limiter.tryAcquire(ip, user)).isFalse();
    }

    @Test
    void resetClearsUserAttempts() {
        String ip = "192.168.1.11";
        String user = "admin";

        for (int i = 0; i < 5; i++) {
            limiter.tryAcquire(ip, user);
        }
        assertThat(limiter.tryAcquire(ip, user)).isFalse();

        limiter.reset(ip, user);
        assertThat(limiter.tryAcquire(ip, user)).isTrue();
    }

    @Test
    void blocksWhenAggregateIpLimitIsReached() {
        String ip = "192.168.1.12";

        for (int i = 0; i < 20; i++) {
            assertThat(limiter.tryAcquire(ip, "user" + i)).isTrue();
        }
        assertThat(limiter.tryAcquire(ip, "user21")).isFalse();
    }

    @Test
    void handlesConcurrentAttemptsWithoutPermittingMoreThanAllowed() throws InterruptedException {
        String ip = "192.168.1.13";
        String user = "concurrent_user";
        int threadCount = 20;

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    if (limiter.tryAcquire(ip, user)) {
                        successCount.incrementAndGet();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        doneLatch.await();
        executor.shutdown();

        assertThat(successCount.get()).isEqualTo(5);
    }
}
