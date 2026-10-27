import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MonoTypeOperatorFunction, defer, fromEvent, mergeMap, takeUntil, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  public readonly online = signal(navigator.onLine);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    fromEvent(window, 'online')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.online.set(true));
    fromEvent(window, 'offline')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.online.set(false));
  }

  public requireOnline<T>(): MonoTypeOperatorFunction<T> {
    return (source) =>
      defer(() => {
        const offline = () => new HttpErrorResponse({ status: 0, statusText: 'Offline' });
        if (!this.online()) return throwError(offline);
        return source.pipe(
          takeUntil(fromEvent(window, 'offline').pipe(mergeMap(() => throwError(offline)))),
        );
      });
  }
}
