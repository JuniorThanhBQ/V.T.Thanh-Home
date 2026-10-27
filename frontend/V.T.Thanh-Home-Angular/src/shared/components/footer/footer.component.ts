import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, timeout } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslationService, SupportedLang } from '@/shared/services/translation.service';
import { BackendHealthService } from '@/shared/services/backend-health.service';
import { PwaLifecycleService } from '@/shared/services/pwa-lifecycle.service';

const LOCALE_TIME_FORMATS: Record<SupportedLang, string> = {
  vi: 'dd/MM/yyyy HH:mm:ss',
  en: 'yyyy-MM-dd HH:mm:ss',
  ja: 'yyyy/MM/dd HH:mm:ss',
  zh: 'yyyy-MM-dd HH:mm:ss',
  fr: 'dd/MM/yyyy HH:mm:ss',
  de: 'dd.MM.yyyy HH:mm:ss',
  es: 'dd/MM/yyyy HH:mm:ss',
  ru: 'dd.MM.yyyy HH:mm:ss',
  kr: 'yyyy. MM. dd. HH:mm:ss',
};

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  public i18n = inject(TranslationService);
  public health = inject(BackendHealthService);
  public readonly pwa = inject(PwaLifecycleService);
  public currentYear = new Date().getFullYear();
  private destroyRef = inject(DestroyRef);
  public currentTime = signal(new Date());
  public readonly viewersCount = signal<number | null>(null);
  private readonly http = inject(HttpClient);

  public timeFormat = computed(() => {
    const lang = this.i18n.currentLang();
    return LOCALE_TIME_FORMATS[lang] ?? 'yyyy-MM-dd HH:mm:ss';
  });

  public healthStatusText = computed(() => {
    if (!this.health.connectivity.online()) return this.i18n.t('pwa.offline');
    const status = this.health.status();
    if (status === 'UP') {
      return this.i18n.t('app.backend_health_up');
    }
    if (status === 'DOWN') {
      return this.i18n.t('app.backend_health_down');
    }
    return this.i18n.t('app.backend_health_standby');
  });

  constructor() {
    toObservable(this.health.connectivity.online)
      .pipe(
        switchMap((online) =>
          online
            ? this.http.get<{ viewers: number }>('/api/viewers').pipe(
                timeout(10000),
                catchError(() => of(null)),
              )
            : of(null),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) =>
        this.viewersCount.set(typeof data?.viewers === 'number' ? data.viewers : null),
      );
    const timerId = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    this.destroyRef.onDestroy(() => {
      clearInterval(timerId);
    });
  }
}
