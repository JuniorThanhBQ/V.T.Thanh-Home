import { finalize, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Component,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@/shared/services/translation.service';
import { BlogShaderService } from '../services/blog-shader.service';
import { BlogApiService } from '../services/blog-api.service';
import { BlogLoadComponent } from './blog.load.component';

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
  imports: [CommonModule, BlogLoadComponent],
  providers: [BlogShaderService],
  templateUrl: '../templates/blog.component.html',
})
export class BlogComponent implements OnInit, AfterViewInit, OnDestroy {
  public i18n = inject(TranslationService);
  private shaderService = inject(BlogShaderService);
  private blogApi = inject(BlogApiService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private request?: Subscription;
  public loadFailed = false;

  @ViewChild('bgCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  public isLoading = false;
  public activePostIndex = 0;
  public selectedPost: BlogPost | null = null;
  public posts: BlogPost[] = [];

  ngOnInit(): void {
    this.loadBlogs();
  }

  public loadBlogs(): void {
    this.request?.unsubscribe();
    this.loadFailed = false;
    this.isLoading = true;
    this.request = this.blogApi
      .getBlogs()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
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
        },
        error: () => {
          this.loadFailed = true;
        },
      });
  }

  public splitParagraphs(markdown: string): string[] {
    return markdown
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
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
    if (post.chapters.length === 0) {
      this.isLoading = true;
      this.loadFailed = false;
      this.request = this.blogApi
        .getBlogBySlug(post.id)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          }),
        )
        .subscribe({
          next: (detail) => {
            if (detail && detail.chapters) {
              post.chapters = detail.chapters.map((ch, idx) => ({
                chapterNumber: String(ch.chapterOrder || idx + 1).padStart(2, '0'),
                title: ch.title,
                markdownContent: ch.content,
              }));
            }
            this.selectedPost = post;
            this.isLoading = false;
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
          error: () => {
            this.loadFailed = true;
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
    this.loadBlogs();
  }
}
