import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);

  public readonly currentTheme = signal<ThemeMode>('dark');

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const saved = localStorage.getItem('app_theme') as ThemeMode | null;
    const initialTheme: ThemeMode = saved
      ? saved
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

    this.applyTheme(initialTheme);
  }

  public toggleTheme(): void {
    const nextTheme: ThemeMode = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  }

  private applyTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
    localStorage.setItem('app_theme', theme);

    if (theme === 'dark') {
      this.document.documentElement.classList.add('dark');
    } else {
      this.document.documentElement.classList.remove('dark');
    }
  }
}
