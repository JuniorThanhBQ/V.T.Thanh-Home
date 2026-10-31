import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { API_ENDPOINTS, buildApiUrl } from '@/configs/apis';

export interface BackendBlogSummary {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  bannerUrl?: string;
  status: string;
  publishedAt?: string;
  version: number;
  createdDate: string;
  updatedDate: string;
}

interface BackendBlogChapter {
  id?: number;
  title: string;
  content: string;
  chapterOrder: number;
}

export interface BackendBlogDetail {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  bannerUrl?: string;
  status: string;
  publishedAt?: string;
  version: number;
  createdDate: string;
  updatedDate: string;
  chapters: BackendBlogChapter[];
}

@Injectable({ providedIn: 'root' })
export class BlogApiService {
  private http = inject(HttpClient);

  public getBlogs(): Observable<BackendBlogSummary[]> {
    return this.http
      .get<BackendBlogSummary[]>(buildApiUrl(API_ENDPOINTS.blogs))
      .pipe(timeout(60000));
  }

  public getBlogBySlug(slug: string): Observable<BackendBlogDetail> {
    return this.http
      .get<BackendBlogDetail>(buildApiUrl(`${API_ENDPOINTS.blogs}/${encodeURIComponent(slug)}`))
      .pipe(timeout(60000));
  }
}
