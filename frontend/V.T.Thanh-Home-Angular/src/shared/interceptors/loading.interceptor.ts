import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (/^\/(?:api|actuator)(?:\/|$)/.test(new URL(req.url, location.origin).pathname))
    return next(req);
  const loading = inject(LoadingService);
  loading.incrementInflight();

  return next(req).pipe(
    finalize(() => {
      loading.decrementInflight();
    }),
  );
};
