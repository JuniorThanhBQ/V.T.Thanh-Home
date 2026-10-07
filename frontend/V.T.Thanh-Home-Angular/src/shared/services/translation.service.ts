import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { LoadingService } from './loading.service';

export type SupportedLang = 'vi' | 'en' | 'zh' | 'ja';

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
    { code: 'zh', labelKey: 'language.zh', flag: '🇨🇳' },
    { code: 'ja', labelKey: 'language.ja', flag: '🇯🇵' },
  ];
  public readonly currentLang = signal<SupportedLang>(
    (localStorage.getItem('user_locale') as SupportedLang) || 'vi',
  );
  private readonly dictionary = signal<Record<string, unknown>>({});

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
    const isInitial = Object.keys(this.dictionary()).length === 0;
    const msg = isInitial ? this.t('loading.initializing') : this.t('loading.switching_language');
    this.loading.show(msg || 'Syncing...');
    this.http.get<Record<string, unknown>>(`/i18n/${lang}.json`).subscribe({
      next: (data) => {
        this.dictionary.set(data);
        setTimeout(() => this.loading.hide(), 550);
      },
      error: (err) => {
        console.error(`Failed to load translation bundle for ${lang}`, err);
        this.loading.hide();
      },
    });
  }

  public t(key: string): string {
    const keys = key.split('.');
    let current: unknown = this.dictionary();
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = (current as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    return typeof current === 'string' ? current : key;
  }
}
