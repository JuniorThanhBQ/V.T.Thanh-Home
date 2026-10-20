package com.vtthanh.V.T.Thanh_Home_SpringBoot;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.VisitorRequest;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Visitor;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.RateLimitExceededException;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.VisitorRepository;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.ChatRateLimiterService;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.VisitorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VisitorServiceTest {

    @Mock
    private VisitorRepository repository;

    @Mock
    private PlatformTransactionManager transactionManager;

    @Mock
    private ChatRateLimiterService limiter;

    @Mock
    private TransactionStatus transactionStatus;

    private VisitorService visitorService;

    @BeforeEach
    void setUp() {
        visitorService = new VisitorService(repository, transactionManager, limiter);
    }

    @Test
    void doesNotCreateSessionWhenRateLimitExceeded() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        doThrow(new RateLimitExceededException("Rate limit exceeded"))
                .when(limiter).checkLimit(anyString());

        VisitorRequest metadata = new VisitorRequest("en", "UTC");

        assertThatThrownBy(() -> visitorService.register(request, metadata))
                .isInstanceOf(RateLimitExceededException.class);

        assertThat(request.getSession(false)).isNull();
    }

    @Test
    void createsSessionWhenRateLimitPermitted() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        when(transactionManager.getTransaction(any())).thenReturn(transactionStatus);

        Visitor mockVisitor = new Visitor(UUID.randomUUID(), "127.0.0.1");
        when(repository.save(any(Visitor.class))).thenReturn(mockVisitor);

        VisitorRequest metadata = new VisitorRequest("en", "UTC");
        visitorService.register(request, metadata);

        assertThat(request.getSession(false)).isNotNull();
    }
}
