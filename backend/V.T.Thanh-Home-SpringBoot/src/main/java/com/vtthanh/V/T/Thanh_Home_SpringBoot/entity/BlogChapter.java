package com.vtthanh.V.T.Thanh_Home_SpringBoot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.Objects;

@Entity
@Table(name = "blog_chapters")
public class BlogChapter extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blog_id", nullable = false)
    private Blog blog;

    @Column(name = "title", nullable = false, length = 160)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "chapter_order", nullable = false)
    private int chapterOrder;

    protected BlogChapter() {
    }

    public BlogChapter(Blog blog, String title, String content, int chapterOrder) {
        this.blog = blog;
        this.title = title;
        this.content = content;
        this.chapterOrder = chapterOrder;
    }

    public Blog getBlog() {
        return blog;
    }

    public void setBlog(Blog blog) {
        this.blog = blog;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public int getChapterOrder() {
        return chapterOrder;
    }

    public void setChapterOrder(int chapterOrder) {
        this.chapterOrder = chapterOrder;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        BlogChapter that = (BlogChapter) o;
        return chapterOrder == that.chapterOrder && Objects.equals(blog, that.blog);
    }

    @Override
    public int hashCode() {
        return Objects.hash(blog, chapterOrder);
    }
}
