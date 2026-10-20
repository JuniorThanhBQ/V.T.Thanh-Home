package com.vtthanh.V.T.Thanh_Home_SpringBoot.controller;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.BlogDetailResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.BlogSummaryResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.BlogUpsertRequest;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.BlogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/blogs")
public class AdminBlogController {

    private final BlogService blogService;

    public AdminBlogController(BlogService blogService) {
        this.blogService = blogService;
    }

    @GetMapping
    public ResponseEntity<List<BlogSummaryResponse>> getAllBlogs() {
        return ResponseEntity.ok(blogService.getAllBlogsForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BlogDetailResponse> getBlogById(@PathVariable Long id) {
        return ResponseEntity.ok(blogService.getBlogByIdForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<BlogDetailResponse> createBlog(@RequestBody BlogUpsertRequest request) {
        BlogDetailResponse created = blogService.createBlog(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BlogDetailResponse> updateBlog(
            @PathVariable Long id,
            @RequestBody BlogUpsertRequest request
    ) {
        BlogDetailResponse updated = blogService.updateBlog(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBlog(@PathVariable Long id) {
        blogService.deleteBlog(id);
        return ResponseEntity.noContent().build();
    }
}
