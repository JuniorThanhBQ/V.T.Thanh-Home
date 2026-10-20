package com.vtthanh.V.T.Thanh_Home_SpringBoot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new Sha256BcryptPasswordEncoder();
    }

    private static class Sha256BcryptPasswordEncoder implements PasswordEncoder {

        private final BCryptPasswordEncoder delegate = new BCryptPasswordEncoder();

        @Override
        public String encode(CharSequence rawPassword) {
            String preHashed = preHash(rawPassword);
            return delegate.encode(preHashed);
        }

        @Override
        public boolean matches(CharSequence rawPassword, String encodedPassword) {
            String preHashed = preHash(rawPassword);
            return delegate.matches(preHashed, encodedPassword);
        }

        @Override
        public boolean upgradeEncoding(String encodedPassword) {
            return delegate.upgradeEncoding(encodedPassword);
        }

        private String preHash(CharSequence rawPassword) {
            if (rawPassword == null) {
                return null;
            }
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(rawPassword.toString().getBytes(StandardCharsets.UTF_8));
                return Base64.getEncoder().encodeToString(hash);
            } catch (NoSuchAlgorithmException e) {
                throw new IllegalStateException("SHA-256 algorithm not available", e);
            }
        }
    }
}
