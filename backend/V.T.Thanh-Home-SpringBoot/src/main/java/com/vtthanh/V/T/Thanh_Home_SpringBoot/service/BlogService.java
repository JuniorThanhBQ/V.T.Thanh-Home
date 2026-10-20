package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.BlogChapterRequest;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.BlogChapterResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.BlogDetailResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.BlogSummaryResponse;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.BlogUpsertRequest;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Blog;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.BlogCategory;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.BlogChapter;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.BlogStatus;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ResourceNotFoundException;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.BlogRepository;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class BlogService {

    private final BlogRepository blogRepository;

    public BlogService(BlogRepository blogRepository) {
        this.blogRepository = blogRepository;
    }

    @Transactional(readOnly = true)
    public List<BlogSummaryResponse> getPublicBlogs() {
        return blogRepository.findByStatusOrderByPublishedAtDescIdDesc(BlogStatus.PUBLISHED)
                .stream()
                .map(this::mapToSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public BlogDetailResponse getPublicBlogBySlug(String slug) {
        return blogRepository.findBySlugAndStatus(slug, BlogStatus.PUBLISHED)
                .map(this::mapToDetail)
                .orElseThrow(() -> new ResourceNotFoundException("Published blog not found with slug: " + slug));
    }

    @Transactional(readOnly = true)
    public List<BlogSummaryResponse> getAllBlogsForAdmin() {
        return blogRepository.findAllByOrderByCreatedDateDesc()
                .stream()
                .map(this::mapToSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public BlogDetailResponse getBlogByIdForAdmin(Long id) {
        return blogRepository.findById(id)
                .map(this::mapToDetail)
                .orElseThrow(() -> new ResourceNotFoundException("Blog not found with id: " + id));
    }

    @Transactional
    public BlogDetailResponse createBlog(BlogUpsertRequest req) {
        if (req.title() == null || req.title().isBlank()) {
            throw new IllegalArgumentException("Blog title is required");
        }
        if (req.slug() == null || req.slug().isBlank()) {
            throw new IllegalArgumentException("Blog slug is required");
        }
        if (blogRepository.existsBySlug(req.slug())) {
            throw new IllegalArgumentException("Blog slug already exists: " + req.slug());
        }

        BlogCategory category = req.category() != null ? req.category() : BlogCategory.TECHNICAL;
        Blog blog = new Blog(req.slug(), req.title(), req.description() != null ? req.description() : "", category);
        blog.setSubtitle(req.subtitle());
        blog.setBannerUrl(req.bannerUrl());
        blog.setStatus(req.status() != null ? req.status() : BlogStatus.DRAFT);

        if (req.chapters() != null) {
            for (BlogChapterRequest chReq : req.chapters()) {
                BlogChapter ch = new BlogChapter(blog, chReq.title(), chReq.content(), chReq.chapterOrder());
                blog.addChapter(ch);
            }
        }

        Blog saved = blogRepository.save(blog);
        return mapToDetail(saved);
    }

    @Transactional
    public BlogDetailResponse updateBlog(Long id, BlogUpsertRequest req) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog not found with id: " + id));

        if (req.version() != null && !req.version().equals(blog.getVersion())) {
            throw new OptimisticLockingFailureException("Version conflict for blog id: " + id);
        }

        if (req.slug() != null && !req.slug().equals(blog.getSlug())) {
            if (blogRepository.existsBySlug(req.slug())) {
                throw new IllegalArgumentException("Blog slug already exists: " + req.slug());
            }
            blog.setSlug(req.slug());
        }

        if (req.title() != null) {
            blog.setTitle(req.title());
        }
        if (req.subtitle() != null) {
            blog.setSubtitle(req.subtitle());
        }
        if (req.description() != null) {
            blog.setDescription(req.description());
        }
        if (req.category() != null) {
            blog.setCategory(req.category());
        }
        if (req.bannerUrl() != null) {
            blog.setBannerUrl(req.bannerUrl());
        }
        if (req.status() != null) {
            blog.setStatus(req.status());
        }

        if (req.chapters() != null) {
            blog.getChapters().clear();
            blogRepository.flush();
            for (BlogChapterRequest chReq : req.chapters()) {
                BlogChapter ch = new BlogChapter(blog, chReq.title(), chReq.content(), chReq.chapterOrder());
                blog.addChapter(ch);
            }
        }

        Blog saved = blogRepository.save(blog);
        return mapToDetail(saved);
    }

    @Transactional
    public void deleteBlog(Long id) {
        if (!blogRepository.existsById(id)) {
            throw new ResourceNotFoundException("Blog not found with id: " + id);
        }
        blogRepository.deleteById(id);
    }

    private BlogSummaryResponse mapToSummary(Blog blog) {
        return new BlogSummaryResponse(
                blog.getId(),
                blog.getSlug(),
                blog.getTitle(),
                blog.getSubtitle(),
                blog.getDescription(),
                blog.getCategory(),
                blog.getBannerUrl(),
                blog.getStatus(),
                blog.getPublishedAt(),
                blog.getVersion(),
                blog.getCreatedDate()
        );
    }

    private BlogDetailResponse mapToDetail(Blog blog) {
        List<BlogChapterResponse> chapterResponses = blog.getChapters()
                .stream()
                .map(ch -> new BlogChapterResponse(ch.getId(), ch.getTitle(), ch.getContent(), ch.getChapterOrder()))
                .toList();

        return new BlogDetailResponse(
                blog.getId(),
                blog.getSlug(),
                blog.getTitle(),
                blog.getSubtitle(),
                blog.getDescription(),
                blog.getCategory(),
                blog.getBannerUrl(),
                blog.getStatus(),
                blog.getPublishedAt(),
                blog.getVersion(),
                blog.getCreatedDate(),
                blog.getUpdatedDate(),
                chapterResponses
        );
    }
}
