import { Component, inject, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@/shared/services/translation.service';
import { BlogShaderService } from '../services/blog-shader.service';
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
export class BlogComponent implements AfterViewInit, OnDestroy {
  public i18n = inject(TranslationService);
  private shaderService = inject(BlogShaderService);

  @ViewChild('bgCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  public isLoading = false;
  public activePostIndex = 0;
  public selectedPost: BlogPost | null = null;
  public readonly posts: BlogPost[] = [];

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
    this.selectedPost = post;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public closeStory(): void {
    this.selectedPost = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public reloadBlog(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 2500);
  }
}
