import { Injectable, signal, inject } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

export type WipeDirection = 'ltr' | 'rtl';

@Injectable({ providedIn: 'root' })
export class RouteTransitionService {
  private router = inject(Router);

  public readonly isWiping = signal<boolean>(false);
  public readonly direction = signal<WipeDirection>('ltr');

  private routeOrder = ['/', '/projects', '/about', '/blog', '/contact'];
  private currentUrl = '/';

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        const fromIdx = this.routeOrder.indexOf(this.currentUrl);
        const toIdx = this.routeOrder.indexOf(event.url);

        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
          this.direction.set(toIdx > fromIdx ? 'ltr' : 'rtl');
          this.triggerWipe();
        }

        this.currentUrl = event.url;
      }
    });
  }

  private triggerWipe(): void {
    this.isWiping.set(true);
    setTimeout(() => {
      this.isWiping.set(false);
    }, 800);
  }
}
