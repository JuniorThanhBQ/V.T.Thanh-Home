import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, signal, inject, DestroyRef, computed } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '@/shared/components/header/header.component';
import { FooterComponent } from '@/shared/components/footer/footer.component';
import { LoadingComponent } from '@/shared/components/loading/loading.component';
import { LoadingService } from '@/shared/services/loading.service';
import { BackendHealthService } from '@/shared/services/backend-health.service';
import { ColorWipeComponent } from '@/shared/components/color-wipe/color-wipe.component';
import { ChatbotComponent } from '@/features/chat/components/chat.component';
import { VisitorService } from '@/shared/services/visitor.service';
import { PwaStatusComponent } from '@/shared/components/pwa-status/pwa-status.component';
import { PwaLifecycleService } from '@/shared/services/pwa-lifecycle.service';

@Component({
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    LoadingComponent,
    ColorWipeComponent,
    ChatbotComponent,
    PwaStatusComponent,
  ],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  public loading = inject(LoadingService);
  public health = inject(BackendHealthService);
  public readonly pwa = inject(PwaLifecycleService);
  public readonly showPwaStatus = computed(
    () =>
      this.pwa.isStandalone() &&
      (!this.health.connectivity.online() ||
        this.pwa.updateAvailable() ||
        this.pwa.unrecoverable()),
  );
  protected readonly title = signal('V.T.Thanh-Home-Angular');

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const visitor = inject(VisitorService);
    toObservable(this.health.available)
      .pipe(
        switchMap((available) =>
          available ? visitor.ensureRegistered().pipe(catchError(() => EMPTY)) : EMPTY,
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe();
  }
}
