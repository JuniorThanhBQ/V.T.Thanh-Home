import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT, Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadingService } from './loading.service';

export type SupportedLang = 'vi' | 'en' | 'zh' | 'ja' | 'fr' | 'de';

export interface LanguageOption {
  code: SupportedLang;
  labelKey: string;
  flag: string;
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private http = inject(HttpClient);
  private loading = inject(LoadingService);
  private document = inject(DOCUMENT);
  private router = inject(Router);
  private location = inject(Location);

  public readonly supportedLanguages: LanguageOption[] = [
    { code: 'vi', labelKey: 'language.vi', flag: '🇻🇳' },
    { code: 'en', labelKey: 'language.en', flag: '🇬🇧' },
    { code: 'ja', labelKey: 'language.ja', flag: '🇯🇵' },
    { code: 'de', labelKey: 'language.de', flag: '🇩🇪' },
    { code: 'fr', labelKey: 'language.fr', flag: '🇫🇷' },
    { code: 'zh', labelKey: 'language.zh', flag: '🇨🇳' },
  ];

  public readonly currentLang = signal<SupportedLang>('vi');
  private readonly dictionary = signal<Map<string, string>>(new Map());
  private readonly nonDefaultLangs = new Set<string>(['en', 'de', 'fr', 'ja', 'zh']);
  private isFetching = false;

  constructor() {
    this.syncLanguageFromUrl(this.location.path());

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.syncLanguageFromUrl(event.urlAfterRedirects);
      });
  }

  private syncLanguageFromUrl(url: string): void {
    const segments = url.split('/').filter(Boolean);
    const firstSegment = segments[0] as string;
    const detectedLang: SupportedLang = this.nonDefaultLangs.has(firstSegment)
      ? (firstSegment as SupportedLang)
      : 'vi';

    if (!this.isFetching && (this.currentLang() !== detectedLang || this.dictionary().size === 0)) {
      this.currentLang.set(detectedLang);
      this.document.documentElement.lang = detectedLang;
      this.loadLanguage(detectedLang);
    }
  }

  public switchLanguage(targetLang: SupportedLang): void {
    if (this.currentLang() === targetLang) return;

    const currentUrl = this.router.url;
    const segments = currentUrl.split('/').filter(Boolean);

    if (segments.length > 0 && this.nonDefaultLangs.has(segments[0])) {
      segments.shift();
    }

    if (targetLang !== 'vi') {
      segments.unshift(targetLang);
    }

    const nextPath = '/' + segments.join('/');
    this.router.navigateByUrl(nextPath);
  }

  private loadLanguage(lang: SupportedLang): void {
    this.isFetching = true;
    const isInitial = this.dictionary().size === 0;
    const msg = isInitial ? this.t('loading.initializing') : this.t('loading.switching_language');
    this.loading.show(msg || 'Syncing...');

    this.http.get<Record<string, unknown>>(`/i18n/${lang}.json`).subscribe({
      next: (data) => {
        const flatMap = new Map<string, string>();
        this.flatten(data, '', flatMap);
        this.dictionary.set(flatMap);
        this.isFetching = false;
        this.loading.hide();
      },
      error: (err) => {
        console.error('Failed to load dictionary:', lang, err);
        this.isFetching = false;
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
