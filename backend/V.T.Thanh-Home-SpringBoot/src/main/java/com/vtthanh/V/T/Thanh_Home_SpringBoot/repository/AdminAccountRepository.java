package com.vtthanh.V.T.Thanh_Home_SpringBoot.repository;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.AdminAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AdminAccountRepository extends JpaRepository<AdminAccount, Long> {

    Optional<AdminAccount> findByUsername(String username);

    boolean existsByUsername(String username);
}
