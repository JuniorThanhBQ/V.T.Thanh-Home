import { Injectable, OnDestroy, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AVATAR_URLS } from '@/assets/cloudinaryUrl';
import {
  ThemeMode,
  THEME_STORAGE_KEY,
  isThemeMode,
  readThemePreference,
  saveThemePreference,
} from '@/shared/utils/preferences';

export type { ThemeMode } from '@/shared/utils/preferences';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  private document = inject(DOCUMENT);
  private savedTheme = readThemePreference();
  private mediaQuery: MediaQueryList | undefined;

  public readonly currentTheme = signal<ThemeMode>('light');

  constructor() {
    try {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.onSystemThemeChange);
    } catch {
      this.mediaQuery = undefined;
    }
    this.applyTheme(this.savedTheme ?? this.systemTheme());
    window.addEventListener('storage', this.onStorageChange);
  }

  public toggleTheme(): void {
    const nextTheme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.savedTheme = nextTheme;
    saveThemePreference(nextTheme);
    this.applyTheme(nextTheme);
  }

  ngOnDestroy(): void {
    this.mediaQuery?.removeEventListener('change', this.onSystemThemeChange);
    window.removeEventListener('storage', this.onStorageChange);
  }

  private systemTheme(): ThemeMode {
    return this.mediaQuery?.matches ? 'dark' : 'light';
  }

  private onSystemThemeChange = (): void => {
    if (this.savedTheme === null) this.applyTheme(this.systemTheme());
  };

  private onStorageChange = (event: StorageEvent): void => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    try {
      if (event.storageArea !== window.localStorage) return;
    } catch {
      return;
    }
    this.savedTheme = event.key !== null && isThemeMode(event.newValue) ? event.newValue : null;
    this.applyTheme(this.savedTheme ?? this.systemTheme());
  };

  private applyTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
    this.document.documentElement.classList.toggle('dark', theme === 'dark');
    this.document.documentElement.style.colorScheme = theme;
    const favicon = this.document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (favicon) favicon.href = theme === 'dark' ? AVATAR_URLS.dark : AVATAR_URLS.light;
  }
}
