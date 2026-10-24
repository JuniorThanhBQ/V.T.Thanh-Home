import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timer, of, timeout, exhaustMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  public readonly isHealthy = signal<boolean | null>(null);
  public readonly lastChecked = signal<Date | null>(null);

  private readonly intervalMs = 1 * 45 * 1000;

  constructor() {
    this.startHealthPolling();
  }

  public checkHealth(): void {
    const url = buildApiUrl(API_ENDPOINTS.actuator.health);

    this.http
      .get<ActuatorHealthResponse>(url)
      .pipe(
        timeout(120000),
        catchError(() => {
          return of({ status: 'DOWN' as const });
        }),
      )
      .subscribe((res) => {
        const isUp = res.status === 'UP';
        this.status.set(isUp ? 'UP' : 'DOWN');
        this.isHealthy.set(isUp);
        this.lastChecked.set(new Date());
      });
  }

  private startHealthPolling(): void {
    timer(0, this.intervalMs)
      .pipe(
        exhaustMap(() =>
          this.http.get<ActuatorHealthResponse>(buildApiUrl(API_ENDPOINTS.actuator.health)).pipe(
            timeout(120000),
            catchError(() => of({ status: 'DOWN' })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        const isUp = res.status === 'UP';
        this.status.set(isUp ? 'UP' : 'DOWN');
        this.isHealthy.set(isUp);
        this.lastChecked.set(new Date());
      });
  }
}
