package com.vtthanh.V.T.Thanh_Home_SpringBoot.controller;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.BlogDetailResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.BlogSummaryResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.BlogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/blogs")
public class BlogController {

    private final BlogService blogService;

    public BlogController(BlogService blogService) {
        this.blogService = blogService;
    }

    @GetMapping
    public ResponseEntity<List<BlogSummaryResponse>> getPublicBlogs() {
        return ResponseEntity.ok(blogService.getPublicBlogs());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<BlogDetailResponse> getPublicBlogBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(blogService.getPublicBlogBySlug(slug));
    }
}
