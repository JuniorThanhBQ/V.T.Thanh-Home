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
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const initialTheme: ThemeMode = saved ? saved : mediaQuery.matches ? 'dark' : 'light';
    this.applyTheme(initialTheme);
    mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem('app_theme')) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  public toggleTheme(): void {
    const nextTheme: ThemeMode = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  }

  private applyTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
    if (theme === 'dark') {
      this.document.documentElement.classList.add('dark');
    } else {
      this.document.documentElement.classList.remove('dark');
    }
    const favicon = this.document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (favicon) {
      favicon.href =
        theme === 'dark'
          ? 'https://res.cloudinary.com/dfolk8pz2/image/upload/v1787040789/J-removebg-preview_gi2ejq.png'
          : 'https://res.cloudinary.com/dfolk8pz2/image/upload/v1787038092/light-removebg-preview_n3wmaa.png';
    }
  }
}
