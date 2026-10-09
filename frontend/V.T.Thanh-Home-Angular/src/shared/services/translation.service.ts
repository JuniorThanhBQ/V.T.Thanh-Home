import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
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

  public readonly supportedLanguages: LanguageOption[] = [
    { code: 'vi', labelKey: 'language.vi', flag: '🇻🇳' },
    { code: 'en', labelKey: 'language.en', flag: '🇬🇧' },
    { code: 'ja', labelKey: 'language.ja', flag: '🇯🇵' },
    { code: 'de', labelKey: 'language.de', flag: '🇩🇪' },
    { code: 'fr', labelKey: 'language.fr', flag: '🇫🇷' },
    { code: 'zh', labelKey: 'language.zh', flag: '🇨🇳' },
  ];

  public readonly currentLang = signal<SupportedLang>(
    (localStorage.getItem('user_locale') as SupportedLang) || 'vi',
  );

  private readonly dictionary = signal<Map<string, string>>(new Map());

  constructor() {
    this.loadLanguage(this.currentLang());
  }

  public setLanguage(lang: SupportedLang): void {
    if (this.currentLang() === lang) return;

    this.currentLang.set(lang);
    localStorage.setItem('user_locale', lang);
    this.document.documentElement.lang = lang;
    this.loadLanguage(lang);
  }

  private loadLanguage(lang: SupportedLang): void {
    const isInitial = this.dictionary().size === 0;
    const msg = isInitial ? this.t('loading.initializing') : this.t('loading.switching_language');
    this.loading.show(msg || 'Syncing...');

    this.http.get<Record<string, unknown>>(`/i18n/${lang}.json`).subscribe({
      next: (data) => {
        const flatMap = new Map<string, string>();
        this.flatten(data, '', flatMap);
        this.dictionary.set(flatMap);
        setTimeout(() => this.loading.hide(), 550);
      },
      error: (err) => {
        console.error('Failed to load translation bundle for:', lang, err);
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
