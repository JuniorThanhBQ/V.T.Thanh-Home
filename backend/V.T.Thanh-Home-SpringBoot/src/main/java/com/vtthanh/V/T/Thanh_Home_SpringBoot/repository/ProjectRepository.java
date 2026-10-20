package com.vtthanh.V.T.Thanh_Home_SpringBoot.repository;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByPublishedTrueOrderByDisplayOrderAscIdAsc();

    Optional<Project> findBySlugAndPublishedTrue(String slug);

    Optional<Project> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Project> findAllByOrderByDisplayOrderAscIdAsc();
}
