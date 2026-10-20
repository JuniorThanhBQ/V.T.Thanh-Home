package com.vtthanh.V.T.Thanh_Home_SpringBoot;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

public class SafeTestDatabaseInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext context) {
        TestPropertyValues.of(
                "spring.datasource.url=" + setting("TEST_DATABASE_URL", "jdbc:postgresql://localhost:5544/vtthanh_test"),
                "spring.datasource.username=" + setting("TEST_DATABASE_USERNAME", "vtthanh_test"),
                "spring.datasource.password=" + setting("TEST_DATABASE_PASSWORD", "test-only-password"),
                "app.admin.username=",
                "app.admin.password=",
                "app.chat.groq-api-keys=",
                "app.chat.groq-api-key=",
                "app.chat.file-url=",
                "app.turnstile.enabled=false",
                "app.mail.worker-enabled=false",
                "server.servlet.session.cookie.secure=false"
        ).applyTo(context);
    }

    private static String setting(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }
}
