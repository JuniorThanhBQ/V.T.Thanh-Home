package com.vtthanh.V.T.Thanh_Home_SpringBoot.repository;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VisitorRepository extends JpaRepository<Visitor, Long> {

    Optional<Visitor> findByVisitorToken(UUID visitorToken);

    boolean existsByVisitorToken(UUID visitorToken);
}
