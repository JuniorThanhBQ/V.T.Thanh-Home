import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, shareReplay, switchMap, tap, throwError, timeout } from 'rxjs';

export interface VisitorSession {
  registered: boolean;
}

@Injectable({ providedIn: 'root' })
export class VisitorService {
  private readonly http = inject(HttpClient);
  private registration?: Observable<VisitorSession>;
  public readonly registered = signal(false);

  public invalidate(): void {
    this.registration = undefined;
    this.registered.set(false);
  }

  public csrf(): Observable<{ token: string }> {
    return this.http.get<{ token: string }>('/api/v1/security/csrf').pipe(timeout(60000));
  }

  public ensureRegistered(): Observable<VisitorSession> {
    if (!this.registration) {
      this.registration = this.csrf().pipe(
        switchMap(() =>
          this.http.post<VisitorSession>('/api/v1/visitors', {
            language: navigator.language,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        ),
        timeout(65000),
        tap(() => this.registered.set(true)),
        catchError((error: unknown) => {
          this.registration = undefined;
          this.registered.set(false);
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.registration;
  }
}
