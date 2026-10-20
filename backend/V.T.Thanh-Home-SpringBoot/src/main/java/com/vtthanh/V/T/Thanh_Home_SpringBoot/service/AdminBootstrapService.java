package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.AdminAccount;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.AdminAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class AdminBootstrapService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapService.class);

    private final AdminAccountRepository adminAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:}")
    private String adminUsername;

    @Value("${app.admin.password:}")
    private String adminPassword;

    public AdminBootstrapService(AdminAccountRepository adminAccountRepository, PasswordEncoder passwordEncoder) {
        this.adminAccountRepository = adminAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        resolveCredentials();
        if (adminUsername == null || adminUsername.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.info("Admin bootstrap credentials not provided; skipping initial admin account creation.");
            return;
        }

        if (!adminAccountRepository.existsByUsername(adminUsername)) {
            String encodedPassword = passwordEncoder.encode(adminPassword);
            AdminAccount admin = new AdminAccount(adminUsername, encodedPassword);
            adminAccountRepository.save(admin);
            log.info("Admin bootstrap account successfully created: {}", adminUsername);
        } else {
            log.debug("Admin account already exists: {}", adminUsername);
        }
    }

    private void resolveCredentials() {
        if (adminUsername != null && !adminUsername.isBlank() && adminPassword != null && !adminPassword.isBlank()) {
            return;
        }

        List<Path> candidatePaths = List.of(
            Paths.get(".env"),
            Paths.get("..", ".env"),
            Paths.get("..", "..", ".env")
        );

        for (Path path : candidatePaths) {
            if (Files.isRegularFile(path)) {
                try {
                    List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.startsWith("#") || trimmed.isEmpty()) {
                            continue;
                        }
                        if (trimmed.startsWith("ADMIN_USERNAME=")) {
                            String value = parseEnvValue(trimmed.substring("ADMIN_USERNAME=".length()));
                            if (adminUsername == null || adminUsername.isBlank()) {
                                adminUsername = value;
                            }
                        } else if (trimmed.startsWith("ADMIN_PASSWORD=")) {
                            String value = parseEnvValue(trimmed.substring("ADMIN_PASSWORD=".length()));
                            if (adminPassword == null || adminPassword.isBlank()) {
                                adminPassword = value;
                            }
                        }
                    }
                } catch (IOException e) {
                    log.warn("Unable to read .env file at {}: {}", path, e.getMessage());
                }

                if (adminUsername != null && !adminUsername.isBlank() && adminPassword != null && !adminPassword.isBlank()) {
                    break;
                }
            }
        }
    }

    private String parseEnvValue(String raw) {
        String trimmed = raw.trim();
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() >= 2) {
            return trimmed.substring(1, trimmed.length() - 1);
        }
        if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length() >= 2) {
            return trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed;
    }
}
