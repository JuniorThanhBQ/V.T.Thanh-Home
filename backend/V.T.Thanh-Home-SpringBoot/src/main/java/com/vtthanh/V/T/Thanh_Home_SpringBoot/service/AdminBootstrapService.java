package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.AdminAccount;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.AdminAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminBootstrapService implements ApplicationRunner {
    private final AdminAccountRepository accounts;
    private final PasswordEncoder encoder;
    private final String username;
    private final String password;

    public AdminBootstrapService(AdminAccountRepository accounts, PasswordEncoder encoder,
            @Value("${app.admin.username:}") String username, @Value("${app.admin.password:}") String password) {
        this.accounts = accounts;
        this.encoder = encoder;
        this.username = username;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!username.isBlank() && !password.isBlank() && !accounts.existsByUsername(username)) {
            if (username.length() > 50 || password.length() < 12 || password.length() > 512) {
                throw new IllegalStateException("Administrator bootstrap credentials do not meet the configured policy");
            }
            accounts.save(new AdminAccount(username, encoder.encode(password)));
        }
    }
}
