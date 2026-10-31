import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MonoTypeOperatorFunction, defer, fromEvent, mergeMap, takeUntil, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  public readonly online = signal(this.isBrowser ? navigator.onLine : true);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (!this.isBrowser) return;
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
        if (!this.isBrowser) return source;
        const offline = () => new HttpErrorResponse({ status: 0, statusText: 'Offline' });
        if (!this.online()) return throwError(offline);
        return source.pipe(
          takeUntil(fromEvent(window, 'offline').pipe(mergeMap(() => throwError(offline)))),
        );
      });
  }
}
