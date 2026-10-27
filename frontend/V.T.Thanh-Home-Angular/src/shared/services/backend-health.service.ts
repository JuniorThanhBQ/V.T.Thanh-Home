import { Injectable, inject, signal, DestroyRef, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timer, of, timeout, exhaustMap, Subject, merge, switchMap, tap, catchError } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ConnectivityService } from './connectivity.service';
import { API_ENDPOINTS, buildApiUrl } from '@/configs/apis';

export type BackendHealthStatus = 'UP' | 'DOWN' | 'UNKNOWN';

export interface ActuatorHealthResponse {
  status: 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'UNKNOWN' | string;
  components?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class BackendHealthService {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  public readonly status = signal<BackendHealthStatus>('UNKNOWN');
  public readonly connectivity = inject(ConnectivityService);
  public readonly isHealthy = computed(() =>
    this.status() === 'UNKNOWN' ? null : this.status() === 'UP',
  );
  public readonly available = computed(() => this.connectivity.online() && this.status() === 'UP');
  public readonly connectionState = computed(() =>
    !this.connectivity.online()
      ? 'offline'
      : this.status() === 'UP'
        ? 'online'
        : this.status() === 'DOWN'
          ? 'unavailable'
          : 'checking',
  );
  public readonly checking = signal(false);
  public readonly lastChecked = signal<Date | null>(null);

  private readonly manualCheck = new Subject<void>();

  constructor() {
    toObservable(this.connectivity.online)
      .pipe(
        switchMap((online) => {
          this.status.set('UNKNOWN');
          this.checking.set(false);
          if (!online) return of(null);
          return merge(timer(0, 45000), this.manualCheck).pipe(
            exhaustMap(() => {
              this.checking.set(true);
              return this.http
                .get<ActuatorHealthResponse>(buildApiUrl(API_ENDPOINTS.actuator.health))
                .pipe(
                  timeout(15000),
                  catchError(() => of({ status: 'DOWN' })),
                  tap(() => this.checking.set(false)),
                );
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (!response) return;
        this.status.set(response.status === 'UP' ? 'UP' : 'DOWN');
        this.lastChecked.set(new Date());
      });
  }

  public checkHealth(): void {
    if (this.connectivity.online()) this.manualCheck.next();
  }
}
