package com.vtthanh.V.T.Thanh_Home_SpringBoot.repository;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Blog;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.BlogStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {

    List<Blog> findByStatusOrderByPublishedAtDescIdDesc(BlogStatus status, Pageable page);

    Optional<Blog> findBySlugAndStatus(String slug, BlogStatus status);

    Optional<Blog> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Blog> findAllByOrderByCreatedDateDesc(Pageable page);
}
