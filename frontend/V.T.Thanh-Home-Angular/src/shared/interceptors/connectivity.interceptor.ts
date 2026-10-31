import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ConnectivityService } from '../services/connectivity.service';
import { BackendHealthService } from '../services/backend-health.service';

export const connectivityInterceptor: HttpInterceptorFn = (request, next) => {
  const pathname = new URL(request.url, 'https://ssr.invalid').pathname;
  if (!/^\/api(?:\/|$)/.test(pathname)) return next(request);
  const connectivity = inject(ConnectivityService);
  const health = inject(BackendHealthService);
  return next(request).pipe(
    connectivity.requireOnline(),
    catchError((error: unknown) => {
      if (
        connectivity.online() &&
        health.status() === 'UP' &&
        error instanceof HttpErrorResponse &&
        [0, 502, 503, 504].includes(error.status)
      ) {
        health.checkHealth();
      }
      return throwError(() => error);
    }),
  );
};
