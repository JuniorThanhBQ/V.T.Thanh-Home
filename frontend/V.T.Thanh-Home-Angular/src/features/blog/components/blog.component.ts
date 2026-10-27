import { finalize, timeout } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Component,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@/shared/services/translation.service';
import { BackendHealthService } from '@/shared/services/backend-health.service';
import { PwaLifecycleService } from '@/shared/services/pwa-lifecycle.service';
import { MarkdownPipe } from '@/shared/pipes/markdown.pipe';
import { BlogShaderService } from '../services/blog-shader.service';
import { BlogApiService } from '../services/blog-api.service';

export interface BlogChapter {
  chapterNumber: string;
  title: string;
  markdownContent: string;
  imageUrl?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  readTime: string;
  heroImage: string;
  summary: string;
  chapters: BlogChapter[];
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, MarkdownPipe],
  providers: [BlogShaderService],
  templateUrl: '../templates/blog.component.html',
})
export class BlogComponent implements AfterViewInit, OnDestroy {
  public readonly pwa = inject(PwaLifecycleService);
  public i18n = inject(TranslationService);
  public health = inject(BackendHealthService);
  private shaderService = inject(BlogShaderService);
  private blogApi = inject(BlogApiService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private isFetching = false;

  @ViewChild('bgCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  public activePostIndex = 0;
  public selectedPost: BlogPost | null = null;
  public posts: BlogPost[] = [];

  constructor() {
    effect(() => {
      if (this.health.available()) {
        this.loadBlogs();
      } else {
        this.selectedPost = null;
      }
    });
  }

  public loadBlogs(): void {
    if (!this.health.available() || this.isFetching) {
      return;
    }
    this.isFetching = true;
    this.blogApi
      .getBlogs()
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isFetching = false;
        }),
      )
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.posts = data.map((b) => ({
              id: b.slug,
              title: b.title,
              category: b.category,
              readTime: '5 min read',
              heroImage:
                b.bannerUrl ||
                'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792385538/J_17_crrpsy.png',
              summary: b.description || b.subtitle || '',
              chapters: [],
            }));
          } else {
            this.posts = [];
          }
          this.activePostIndex = 0;
          this.cdr.markForCheck();
        },
        error: () => {
          this.posts = [];
          this.cdr.markForCheck();
        },
      });
  }

  ngAfterViewInit(): void {
    if (this.canvasRef?.nativeElement) {
      this.shaderService.init(this.canvasRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.shaderService.destroy();
  }

  public nextPost(): void {
    if (this.activePostIndex < this.posts.length - 1) {
      this.activePostIndex++;
    } else {
      this.activePostIndex = 0;
    }
  }

  public prevPost(): void {
    if (this.activePostIndex > 0) {
      this.activePostIndex--;
    } else {
      this.activePostIndex = this.posts.length - 1;
    }
  }

  public openStory(post: BlogPost): void {
    if (!this.health.available()) return;
    if (post.chapters.length === 0) {
      this.blogApi
        .getBlogBySlug(post.id)
        .pipe(timeout(15000), takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (detail) => {
            if (!this.health.available()) return;
            if (detail && detail.chapters) {
              post.chapters = detail.chapters.map((ch, idx) => ({
                chapterNumber: String(ch.chapterOrder || idx + 1).padStart(2, '0'),
                title: ch.title,
                markdownContent: ch.content,
              }));
            }
            this.selectedPost = post;
            this.cdr.markForCheck();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
          error: () => {
            this.selectedPost = null;
            this.cdr.markForCheck();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
        });
    } else {
      this.selectedPost = post;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  public closeStory(): void {
    this.selectedPost = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public reloadBlog(): void {
    if (this.health.available()) {
      this.loadBlogs();
    }
  }
}
