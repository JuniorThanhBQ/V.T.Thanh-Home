import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, timeout, tap } from 'rxjs';
import { VisitorService } from '@/shared/services/visitor.service';
import { map, catchError } from 'rxjs/operators';
import { API_ENDPOINTS, buildApiUrl } from '@/configs/apis';

export interface SystemMetrics {
  springBootVersion: string;
  javaVersion: string;
  uptime: string;
  heapUsedMb: number;
  heapMaxMb: number;
  activeThreads: number;
  activeProfile: string;
  databaseStatus: 'UP' | 'DOWN';
  databaseName: string;
  databasePool: string;
}

export interface BlogPostItem {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  status: 'PUBLISHED' | 'DRAFT';
  publishedAt: string;
  heroImage: string;
  slug?: string;
  version?: number;
  content?: string;
  chapters?: { title: string; content: string; chapterOrder: number }[];
}

export interface ChatHistoryItem {
  id: string;
  userQuery: string;
  botResponse: string;
  model: string;
  timestamp: string;
  tokens: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private visitor = inject(VisitorService);
  private readonly storageKey = 'vtthanh_admin_session';

  public readonly isAuthenticated = signal(false);
  public readonly adminUser = signal<string | null>(null);

  public readonly metrics = signal<SystemMetrics>({
    springBootVersion: '4.1.1',
    javaVersion: '25',
    uptime: 'Unavailable',
    heapUsedMb: 0,
    heapMaxMb: 0,
    activeThreads: 0,
    activeProfile: 'Unavailable',
    databaseStatus: 'DOWN',
    databaseName: 'PostgreSQL 18',
    databasePool: 'Unavailable',
  });

  public readonly heapUsagePercentage = computed(() => {
    const m = this.metrics();
    return m.heapMaxMb > 0 ? Math.round((m.heapUsedMb / m.heapMaxMb) * 100) : 0;
  });

  public readonly posts = signal<BlogPostItem[]>([]);
  public readonly chatHistory = signal<ChatHistoryItem[]>([]);
  public readonly operationError = signal('');

  constructor() {
    this.checkSession();
  }

  public checkSession(): void {
    const url = buildApiUrl(API_ENDPOINTS.admin.session);
    this.http
      .get<{ authenticated: boolean; username: string }>(url, { withCredentials: true })
      .subscribe({
        next: (res) => {
          if (res && res.authenticated) {
            this.isAuthenticated.set(true);
            this.adminUser.set(res.username);
            this.loadPosts();
          }
        },
        error: () => {
          this.isAuthenticated.set(false);
          this.adminUser.set(null);
        },
      });
  }

  public login(user: string, pass: string): Observable<boolean> {
    const url = buildApiUrl(API_ENDPOINTS.admin.login);
    return this.visitor.csrf().pipe(
      switchMap(() =>
        this.http.post<{ authenticated: boolean; username: string }>(
          url,
          { username: user, password: pass },
          { withCredentials: true },
        ),
      ),
      timeout(65000),
      map((res) => {
        this.isAuthenticated.set(true);
        this.adminUser.set(res.username || user);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(this.storageKey, 'true');
        }
        return true;
      }),
      catchError(() => {
        this.isAuthenticated.set(false);
        this.adminUser.set(null);
        return of(false);
      }),
    );
  }

  public logout(): void {
    const url = buildApiUrl(API_ENDPOINTS.admin.logout);
    this.http.post(url, {}, { withCredentials: true }).subscribe({
      next: () => undefined,
      error: () => undefined,
    });
    this.isAuthenticated.set(false);
    this.adminUser.set(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.storageKey);
    }
  }

  public loadPosts(): void {
    this.http
      .get<BlogApiRecord[]>(API_ENDPOINTS.admin.blogs)
      .pipe(timeout(60000))
      .subscribe({
        next: (posts) => this.posts.set(posts.map((post) => this.mapPost(post))),
        error: () => this.operationError.set('Unable to load posts from the server.'),
      });
  }

  public loadPostContent(id: string): Observable<BlogPostItem> {
    return this.http
      .get<BlogApiRecord>(`${API_ENDPOINTS.admin.blogs}/${encodeURIComponent(id)}`)
      .pipe(
        timeout(60000),
        map((post) => this.mapPost(post)),
        tap((post) =>
          this.posts.update((posts) => posts.map((item) => (item.id === post.id ? post : item))),
        ),
      );
  }

  public createPost(post: Omit<BlogPostItem, 'id' | 'publishedAt'>): void {
    const slug =
      post.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u0111\u0110]/g, 'd')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100) || `post-${Date.now()}`;
    this.savePost('POST', API_ENDPOINTS.admin.blogs, { ...post, slug });
  }

  public updatePost(id: string, updated: Partial<BlogPostItem>): void {
    const existing = this.posts().find((post) => post.id === id);
    if (!existing) return;
    this.savePost('PUT', `${API_ENDPOINTS.admin.blogs}/${encodeURIComponent(id)}`, {
      ...existing,
      ...updated,
    });
  }

  private savePost(method: string, url: string, post: Partial<BlogPostItem>): void {
    this.operationError.set('');
    const body = {
      slug: post.slug,
      title: post.title,
      description: post.summary,
      category: post.category,
      bannerUrl: post.heroImage,
      status: post.status,
      version: post.version,
      chapters:
        post.content !== undefined
          ? post.chapters?.length
            ? post.chapters.map((chapter, index) =>
                index === 0 ? { ...chapter, content: post.content } : chapter,
              )
            : [{ title: post.title, content: post.content, chapterOrder: 1 }]
          : undefined,
    };
    this.http
      .request<BlogApiRecord>(method, url, { body })
      .pipe(timeout(60000))
      .subscribe({
        next: () => this.loadPosts(),
        error: () =>
          this.operationError.set(
            'Unable to save the post. Check the fields or refresh after a concurrent edit.',
          ),
      });
  }

  public deletePost(id: string): void {
    this.http
      .delete(`${API_ENDPOINTS.admin.blogs}/${encodeURIComponent(id)}`)
      .pipe(timeout(60000))
      .subscribe({
        next: () => this.loadPosts(),
        error: () => this.operationError.set('Unable to delete the post.'),
      });
  }

  public refreshMetrics(): void {
    this.http
      .get<{ status: string }>(buildApiUrl(API_ENDPOINTS.actuator.health))
      .pipe(timeout(60000))
      .subscribe({
        next: (health) =>
          this.metrics.update((current) => ({
            ...current,
            databaseStatus: health.status === 'UP' ? 'UP' : 'DOWN',
          })),
        error: () => this.metrics.update((current) => ({ ...current, databaseStatus: 'DOWN' })),
      });
  }

  private mapPost(post: BlogApiRecord): BlogPostItem {
    const content = post.chapters?.[0]?.content;
    return {
      id: String(post.id),
      slug: post.slug,
      version: post.version,
      title: post.title,
      category: post.category,
      status: post.status,
      summary: post.description,
      content,
      chapters: post.chapters,
      readTime: content
        ? `${Math.max(1, Math.ceil(content.split(/\s+/).length / 200))} min read`
        : '',
      publishedAt: post.publishedAt || '',
      heroImage: post.bannerUrl || '',
    };
  }
}

interface BlogApiRecord {
  id: number;
  slug: string;
  version: number;
  title: string;
  description: string;
  category: string;
  status: 'PUBLISHED' | 'DRAFT';
  bannerUrl?: string;
  publishedAt?: string;
  chapters?: { title: string; content: string; chapterOrder: number }[];
}
