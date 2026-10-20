import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  Subject,
  catchError,
  defer,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  takeUntil,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import { VisitorService } from '@/shared/services/visitor.service';
import { API_ENDPOINTS } from '@/configs/apis';
import {
  AdminBlog,
  AdminContact,
  AdminCredentials,
  AdminProject,
  AdminSection,
  AdminVisitor,
  BlogWrite,
  ProjectWrite,
  RuntimeMetrics,
} from './admin.models';

interface AdminSession {
  authenticated: boolean;
}
interface MetricResponse {
  measurements: { statistic: string; value: number }[];
}
interface HealthResponse {
  status: string;
  components?: { db?: { status: string } };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly visitor = inject(VisitorService);
  private readonly sessionEnded = new Subject<void>();
  private revision = 0;
  public readonly isAuthenticated = signal(false);
  public readonly checkingSession = signal(true);
  public readonly sessionError = signal('');
  public readonly posts = signal<AdminBlog[]>([]);
  public readonly projects = signal<AdminProject[]>([]);
  public readonly contacts = signal<AdminContact[]>([]);
  public readonly visitors = signal<AdminVisitor[]>([]);
  public readonly visitorPage = signal(0);
  public readonly metrics = signal<RuntimeMetrics | null>(null);
  public readonly loading = signal<Partial<Record<AdminSection, boolean>>>({});
  public readonly errors = signal<Partial<Record<AdminSection, string>>>({});

  constructor() {
    try {
      sessionStorage.removeItem('vtthanh_admin_session');
    } catch {
      this.clearSession();
    }
    this.checkSession();
  }

  public checkSession(): void {
    const revision = ++this.revision;
    this.checkingSession.set(true);
    this.sessionError.set('');
    this.read<AdminSession>(API_ENDPOINTS.admin.session).subscribe({
      next: (session) => {
        if (revision !== this.revision) return;
        if (session.authenticated) this.isAuthenticated.set(true);
        else this.clearSession();
        this.checkingSession.set(false);
      },
      error: (error: unknown) => {
        if (revision !== this.revision) return;
        this.clearSession();
        this.checkingSession.set(false);
        if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
          this.sessionError.set(
            'Unable to check the administrator session. Check the backend and retry.',
          );
        }
      },
    });
  }

  public login(credentials: AdminCredentials): Observable<boolean> {
    return defer(() => {
      ++this.revision;
      this.clearSession();
      this.checkingSession.set(false);
      this.sessionError.set('');
      return this.visitor.csrf().pipe(
        switchMap(() =>
          this.http.post<AdminSession>(API_ENDPOINTS.admin.login, credentials, {
            withCredentials: true,
          }),
        ),
        timeout(65000),
        map((session) => session.authenticated === true),
        tap((authenticated) => this.isAuthenticated.set(authenticated)),
        finalize(() => {
          credentials.username = '';
          credentials.password = '';
        }),
      );
    });
  }

  public logout(): Observable<void> {
    return this.write<void>('POST', API_ENDPOINTS.admin.logout, {}).pipe(
      tap(() => {
        ++this.revision;
        this.clearSession();
        this.visitor.invalidate();
      }),
    );
  }

  public loadPosts(): void {
    this.load('blogs', this.read<AdminBlog[]>(API_ENDPOINTS.admin.blogs), (posts) =>
      this.posts.set(posts),
    );
  }
  public loadProjects(): void {
    this.load('projects', this.read<AdminProject[]>(API_ENDPOINTS.admin.projects), (projects) =>
      this.projects.set(projects),
    );
  }
  public loadContacts(): void {
    this.load('contacts', this.read<AdminContact[]>(API_ENDPOINTS.admin.contacts), (contacts) =>
      this.contacts.set(contacts),
    );
  }
  public loadVisitors(page = this.visitorPage()): void {
    this.load(
      'visitors',
      this.read<AdminVisitor[]>(`${API_ENDPOINTS.admin.users}?page=${page}`),
      (visitors) => {
        this.visitors.set(visitors);
        this.visitorPage.set(page);
      },
    );
  }

  public loadMetrics(): void {
    let unavailable = false;
    const optional = <T>(source: Observable<T>): Observable<T | null> =>
      source.pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && [401, 403].includes(error.status))
            return throwError(() => error);
          unavailable = true;
          return of(null);
        }),
      );
    const metric = (name: string, heap = false) =>
      optional(
        this.read<MetricResponse>(
          `${API_ENDPOINTS.actuator.metrics}/${name}${heap ? '?tag=area:heap' : ''}`,
        ),
      ).pipe(
        map(
          (response) =>
            response?.measurements.find((item) => item.statistic === 'VALUE')?.value ?? null,
        ),
      );
    this.load(
      'overview',
      forkJoin({
        health: optional(this.read<HealthResponse>(API_ENDPOINTS.actuator.health)),
        uptimeSeconds: metric('process.uptime'),
        heapUsedBytes: metric('jvm.memory.used', true),
        heapMaxBytes: metric('jvm.memory.max', true),
        liveThreads: metric('jvm.threads.live'),
      }),
      (result) => {
        this.metrics.set({
          ...result,
          health: result.health?.status ?? null,
          database: result.health?.components?.db?.status ?? null,
          checkedAt: new Date().toISOString(),
        });
        if (unavailable)
          this.errors.update((errors) => ({
            ...errors,
            overview: 'Some runtime measurements are unavailable. Refresh to retry.',
          }));
      },
    );
  }

  public loadPostContent(id: number): Observable<AdminBlog> {
    return this.read<AdminBlog>(`${API_ENDPOINTS.admin.blogs}/${id}`);
  }
  public loadProject(id: number): Observable<AdminProject> {
    return this.read<AdminProject>(`${API_ENDPOINTS.admin.projects}/${id}`);
  }
  public savePost(post: BlogWrite, id: number | null): Observable<AdminBlog> {
    return this.write<AdminBlog>(
      id === null ? 'POST' : 'PUT',
      `${API_ENDPOINTS.admin.blogs}${id === null ? '' : `/${id}`}`,
      post,
    );
  }
  public saveProject(project: ProjectWrite, id: number | null): Observable<AdminProject> {
    return this.write<AdminProject>(
      id === null ? 'POST' : 'PUT',
      `${API_ENDPOINTS.admin.projects}${id === null ? '' : `/${id}`}`,
      project,
    );
  }
  public deleteRecord(kind: 'blogs' | 'projects' | 'contacts', id: number): Observable<void> {
    return this.write<void>('DELETE', `${API_ENDPOINTS.admin[kind]}/${id}`);
  }
  public blockVisitor(id: number, blocked: boolean, reason: string): Observable<AdminVisitor> {
    return this.write<AdminVisitor>('PATCH', `${API_ENDPOINTS.admin.users}/${id}/block`, {
      blocked,
      reason,
    });
  }

  public errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'Your administrator session expired. Sign in again.';
      if (error.status === 403)
        return 'Access denied or security token expired. Sign out and sign in again.';
      if (error.status === 409)
        return 'This record changed or conflicts with another record. Close and reopen the editor before retrying.';
      if (error.status === 400)
        return 'The server rejected these fields. Check required fields, unique slugs, URLs and content limits.';
      if (error.status === 413) return 'The request is too large. Reduce the content size.';
      if (error.status === 429) return 'Too many requests. Wait before trying again.';
    }
    return 'The request could not be completed. Check the backend and retry. Your changes have not been confirmed.';
  }

  private read<T>(url: string): Observable<T> {
    return this.http.get<T>(url, { withCredentials: true }).pipe(
      timeout(60000),
      takeUntil(this.sessionEnded),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) this.expireSession();
        return throwError(() => error);
      }),
    );
  }
  private write<T>(method: string, url: string, body?: unknown): Observable<T> {
    return this.visitor.csrf().pipe(
      switchMap(() => this.http.request<T>(method, url, { body, withCredentials: true })),
      timeout(65000),
      takeUntil(this.sessionEnded),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) this.expireSession();
        return throwError(() => error);
      }),
    );
  }
  private load<T>(section: AdminSection, request: Observable<T>, accept: (value: T) => void): void {
    if (!this.isAuthenticated() || this.loading()[section]) return;
    this.loading.update((state) => ({ ...state, [section]: true }));
    this.errors.update((state) => ({ ...state, [section]: '' }));
    request
      .pipe(finalize(() => this.loading.update((state) => ({ ...state, [section]: false }))))
      .subscribe({
        next: accept,
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && [401, 403].includes(error.status))
            this.expireSession();
          else this.errors.update((state) => ({ ...state, [section]: this.errorMessage(error) }));
        },
      });
  }
  private expireSession(): void {
    ++this.revision;
    this.clearSession();
    this.checkingSession.set(false);
    this.sessionError.set('Your administrator session is no longer available. Sign in again.');
  }
  private clearSession(): void {
    this.sessionEnded.next();
    this.isAuthenticated.set(false);
    this.posts.set([]);
    this.projects.set([]);
    this.contacts.set([]);
    this.visitors.set([]);
    this.visitorPage.set(0);
    this.metrics.set(null);
    this.errors.set({});
    this.loading.set({});
  }
}
