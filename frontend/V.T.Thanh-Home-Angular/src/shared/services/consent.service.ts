import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { inject as injectAnalytics } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

export interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  decidedAt: string | null;
}

declare const process: {
  env: { VERCEL_OBSERVABILITY_CLIENT_CONFIG: string };
};

const CONSENT_STORAGE_KEY = 'vtthanh_consent_v1';

@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly preferencesState = signal<ConsentPreferences>(this.readInitialPreferences());
  private readonly bannerOpenState = signal<boolean>(false);
  private telemetryInitialized = false;

  public readonly preferences = this.preferencesState.asReadonly();
  public readonly hasDecided = computed(() => this.preferencesState().decidedAt !== null);
  public readonly isBannerVisible = computed(() => !this.hasDecided() || this.bannerOpenState());
  public readonly analyticsAllowed = computed(() => this.preferencesState().analytics);

  constructor() {
    if (this.isBrowser && this.analyticsAllowed()) {
      this.initTelemetry();
    }
  }

  public openBanner(): void {
    this.bannerOpenState.set(true);
  }

  public closeBanner(): void {
    this.bannerOpenState.set(false);
  }

  public acceptAll(): void {
    const next: ConsentPreferences = {
      essential: true,
      analytics: true,
      decidedAt: new Date().toISOString(),
    };
    this.persist(next);
    this.bannerOpenState.set(false);
    this.initTelemetry();
  }

  public declineNonEssential(): void {
    const next: ConsentPreferences = {
      essential: true,
      analytics: false,
      decidedAt: new Date().toISOString(),
    };
    this.persist(next);
    this.bannerOpenState.set(false);
  }

  private readInitialPreferences(): ConsentPreferences {
    if (!this.isBrowser) {
      return { essential: true, analytics: false, decidedAt: null };
    }
    try {
      const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as ConsentPreferences;
      }
    } catch {
      return { essential: true, analytics: false, decidedAt: null };
    }
    return { essential: true, analytics: false, decidedAt: null };
  }

  private persist(prefs: ConsentPreferences): void {
    this.preferencesState.set(prefs);
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      return;
    }
  }

  private initTelemetry(): void {
    if (!this.isBrowser || this.telemetryInitialized) return;
    if (['localhost', '127.0.0.1'].includes(location.hostname)) return;

    try {
      injectAnalytics({}, process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG);
      injectSpeedInsights({}, process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG);
      this.telemetryInitialized = true;
    } catch {
      return;
    }
  }
}
