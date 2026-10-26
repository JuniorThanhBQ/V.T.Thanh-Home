package com.vtthanh.V.T.Thanh_Home_SpringBoot;

import io.sentry.SentryEvent;
import io.sentry.SentryOptions;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "sentry.enabled=true",
        "sentry.dsn=http://public@localhost:1/1",
        "sentry.traces-sample-rate=0"
})
@ContextConfiguration(initializers = SafeTestDatabaseInitializer.class)
@Import(SentryIntegrationTest.Configuration.class)
class SentryIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private BlockingQueue<SentryEvent> events;

    @Test
    void unexpectedFailureIsCapturedWhileClientReceivesSanitizedResponse() throws Exception {
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        events.clear();

        mvc.perform(get("/api/v1/projects/sentry-verification"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"));

        SentryEvent event = events.poll(5, TimeUnit.SECONDS);
        assertNotNull(event);
        assertEquals("Sentry backend integration test", event.getThrowable().getMessage());
        assertEquals(0, events.size());
    }

    @TestConfiguration
    static class Configuration {
        @Bean
        BlockingQueue<SentryEvent> sentryEvents() {
            return new LinkedBlockingQueue<>();
        }

        @Bean
        SentryOptions.BeforeSendCallback sentryTestCapture(BlockingQueue<SentryEvent> events) {
            return (event, hint) -> {
                events.offer(event);
                return null;
            };
        }

        @Bean
        ProbeController sentryProbeController() {
            return new ProbeController();
        }
    }

    @RestController
    static class ProbeController {
        @GetMapping("/api/v1/projects/sentry-verification")
        void fail() {
            throw new IllegalStateException("Sentry backend integration test");
        }
    }
}
