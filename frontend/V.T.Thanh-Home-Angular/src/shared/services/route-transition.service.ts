import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type WipeDirection = 'ltr' | 'rtl';

@Injectable({ providedIn: 'root' })
export class RouteTransitionService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  public readonly isWiping = signal<boolean>(false);
  public readonly direction = signal<WipeDirection>('ltr');
  private readonly routeOrder = ['/', '/projects', '/about', '/blog', '/contact'];
  private readonly nonDefaultLangs = new Set<string>([
    'en',
    'de',
    'fr',
    'ja',
    'zh',
    'es',
    'ru',
    'kr',
  ]);

  private currentNormalizedPath: string;
  private wipeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.currentNormalizedPath = this.normalizePath(this.location.path() || '/');
    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event: NavigationStart) => {
        const toNormalized = this.normalizePath(event.url);
        const fromIdx = this.routeOrder.indexOf(this.currentNormalizedPath);
        const toIdx = this.routeOrder.indexOf(toNormalized);

        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
          this.direction.set(toIdx > fromIdx ? 'ltr' : 'rtl');
          this.triggerWipe();
        }

        this.currentNormalizedPath = toNormalized;
      });

    this.destroyRef.onDestroy(() => {
      this.clearWipeTimer();
    });
  }

  private normalizePath(rawUrl: string): string {
    const cleanUrl = rawUrl.split(/[?#]/)[0] ?? '';
    const segments = cleanUrl.split('/').filter(Boolean);

    if (segments.length > 0 && this.nonDefaultLangs.has(segments[0])) {
      segments.shift();
    }

    return segments.length === 0 ? '/' : `/${segments.join('/')}`;
  }

  private triggerWipe(): void {
    if (typeof window === 'undefined') return;
    this.clearWipeTimer();
    this.isWiping.set(true);

    this.wipeTimer = setTimeout(() => {
      this.isWiping.set(false);
      this.wipeTimer = null;
    }, 800);
  }

  private clearWipeTimer(): void {
    if (this.wipeTimer !== null) {
      clearTimeout(this.wipeTimer);
      this.wipeTimer = null;
    }
  }
}
