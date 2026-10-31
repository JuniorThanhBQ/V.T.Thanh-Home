import {
  DestroyRef,
  Injectable,
  TransferState,
  makeStateKey,
  PLATFORM_ID,
  afterNextRender,
  signal,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT, Location, isPlatformServer } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadingService } from './loading.service';
import { Subscription, timeout } from 'rxjs';
import {
  SupportedLang,
  initialLanguage,
  isSupportedLanguage,
  languageFromPath,
  saveLanguagePreference,
  updateLanguageMetadata,
} from '@/shared/utils/preferences';

export type { SupportedLang } from '@/shared/utils/preferences';

export interface LanguageOption {
  code: SupportedLang;
  labelKey: string;
  flag: string;
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly transferState = inject(TransferState);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
  private http = inject(HttpClient);
  private loading = inject(LoadingService);
  private document = inject(DOCUMENT);
  private router = inject(Router);
  private location = inject(Location);
  private destroyRef = inject(DestroyRef);

  public readonly supportedLanguages: LanguageOption[] = [
    { code: 'vi', labelKey: 'language.vi', flag: '🇻🇳' },
    { code: 'en', labelKey: 'language.en', flag: '🇬🇧' },
    { code: 'ja', labelKey: 'language.ja', flag: '🇯🇵' },
    { code: 'de', labelKey: 'language.de', flag: '🇩🇪' },
    { code: 'fr', labelKey: 'language.fr', flag: '🇫🇷' },
    { code: 'zh', labelKey: 'language.zh', flag: '🇨🇳' },
    { code: 'ru', labelKey: 'language.ru', flag: '🇷🇺' },
    { code: 'kr', labelKey: 'language.kr', flag: '🇰🇷' },
    { code: 'es', labelKey: 'language.es', flag: '🇪🇸' },
  ];

  public readonly currentLang = signal<SupportedLang>('vi');
  private readonly dictionary = signal<Map<string, string>>(new Map());
  private languageRequest?: Subscription;
  private requestedLanguage: SupportedLang | undefined;
  private dictionaryLanguage: SupportedLang | undefined;
  private requestVersion = 0;
  private initialRedirect: string | undefined;

  constructor() {
    this.syncLanguageFromUrl(this.location.path(true) || '/');
    afterNextRender(() => {
      this.syncLanguageFromUrl(this.location.path(true) || '/', true);
    });
    this.destroyRef.onDestroy(() => {
      this.requestVersion++;
      this.languageRequest?.unsubscribe();
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.syncLanguageFromUrl(event.urlAfterRedirects);
      });
  }

  private syncLanguageFromUrl(url: string, restorePreference = false): void {
    const pathname = new URL(url, 'https://www.juniorthanh.id.vn').pathname;
    const detectedLang = restorePreference ? initialLanguage(pathname) : languageFromPath(pathname);
    let metadataPath = pathname;
    if (pathname === '/' && detectedLang !== 'vi') {
      const nextUrl = this.urlWithLanguage(url, detectedLang);
      metadataPath = '/' + detectedLang;
      if (this.initialRedirect !== nextUrl) {
        this.initialRedirect = nextUrl;
        void this.router.navigateByUrl(nextUrl, { replaceUrl: true });
      }
    }
    updateLanguageMetadata(this.document, metadataPath);
    this.currentLang.set(detectedLang);
    this.loadLanguage(detectedLang);
  }

  public switchLanguage(targetLang: SupportedLang): void {
    if (!isSupportedLanguage(targetLang)) return;
    if (this.currentLang() === targetLang) {
      saveLanguagePreference(targetLang);
      return;
    }
    const nextUrl = this.urlWithLanguage(this.router.url, targetLang);
    void this.router.navigateByUrl(nextUrl).then((success) => {
      if (success) saveLanguagePreference(targetLang);
    });
  }

  private urlWithLanguage(url: string, language: SupportedLang): string {
    const parsed = new URL(url, 'https://www.juniorthanh.id.vn');
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (isSupportedLanguage(segments[0]) && segments[0] !== 'vi') {
      segments.shift();
    }
    if (language !== 'vi') segments.unshift(language);
    return '/' + segments.join('/') + parsed.search + parsed.hash;
  }

  private loadLanguage(lang: SupportedLang): void {
    if (this.requestedLanguage === lang) return;
    const stateKey = makeStateKey<Record<string, unknown>>(`dictionary-${lang}`);
    if (!this.isServer && this.dictionary().size === 0 && this.transferState.hasKey(stateKey)) {
      const flatMap = new Map<string, string>();
      this.flatten(this.transferState.get(stateKey, {}), '', flatMap);
      this.transferState.remove(stateKey);
      this.dictionary.set(flatMap);
      this.dictionaryLanguage = lang;
      return;
    }
    const version = ++this.requestVersion;
    const wasLoading = this.requestedLanguage !== undefined;
    this.languageRequest?.unsubscribe();
    this.requestedLanguage = undefined;
    if (this.dictionaryLanguage === lang) {
      if (wasLoading) this.loading.hide();
      return;
    }
    this.requestedLanguage = lang;
    const isInitial = this.dictionary().size === 0;
    const msg = isInitial ? this.t('loading.initializing') : this.t('loading.switching_language');
    this.loading.show(msg || 'Syncing...');

    this.languageRequest = this.http
      .get<Record<string, unknown>>(`/i18n/${lang}.json`)
      .pipe(timeout(15000))
      .subscribe({
        next: (data) => {
          if (version !== this.requestVersion) return;
          if (this.isServer) this.transferState.set(stateKey, data);
          const flatMap = new Map<string, string>();
          this.flatten(data, '', flatMap);
          this.dictionary.set(flatMap);
          this.dictionaryLanguage = lang;
          this.requestedLanguage = undefined;
          this.loading.hide();
        },
        error: (err) => {
          if (version !== this.requestVersion) return;
          console.error('Failed to load dictionary:', lang, err);
          this.requestedLanguage = undefined;
          this.loading.hide();
        },
      });
  }

  private flatten(obj: Record<string, unknown>, prefix: string, map: Map<string, string>): void {
    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      const val = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (val && typeof val === 'object' && !Array.isArray(val)) {
        this.flatten(val as Record<string, unknown>, newKey, map);
      } else if (typeof val === 'string') {
        map.set(newKey, val);
      }
    }
  }

  public t(key: string): string {
    return this.dictionary().get(key) ?? key;
  }
}
