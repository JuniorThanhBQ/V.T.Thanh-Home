import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService, SupportedLang } from '@/shared/services/translation.service';
import { ThemeService } from '@/shared/services/theme.service';
import { AVATAR_URLS } from '@/assets/cloudinaryUrl';

export interface NavItem {
  path: string;
  translationKey: string;
  exact?: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header
      class="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="w-[30%] flex items-center">
          <a
            routerLink="/"
            class="animate-stagger-item flex items-center space-x-2 text-sky-600 dark:text-sky-400 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
            style="--i: 0;"
          >
            <img
              [src]="theme.currentTheme() === 'light' ? avatarUrls.light : avatarUrls.dark"
              alt="V.T.Thanh Logo"
              class="w-18 h-18 object-contain transition-opacity duration-300"
            />
            <span class="text-slate-900 dark:text-white font-semibold tracking-wide">{{
              i18n.t('app.Author')
            }}</span>
          </a>
        </div>

        <div class="w-[70%] flex items-center justify-end space-x-6 sm:space-x-8">
          <nav class="hidden md:flex items-center space-x-8 text-sm font-medium">
            @for (item of navItems; track item.path; let idx = $index) {
              <a
                [routerLink]="item.path"
                routerLinkActive="!text-sky-600 dark:!text-sky-400 font-semibold"
                [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                class="animate-stagger-item group relative px-1.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
                [style.--i]="idx + 1"
              >
                <span
                  class="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-sky-500 opacity-0 -translate-x-1 -translate-y-1 transition-all duration-200 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
                ></span>
                <span class="relative z-10">{{ i18n.t(item.translationKey) }}</span>
                <span
                  class="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-sky-500 opacity-0 translate-x-1 translate-y-1 transition-all duration-200 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
                ></span>
              </a>
            }
          </nav>

          <div class="relative animate-stagger-item" [style.--i]="navItems.length + 1">
            <button
              type="button"
              (click)="toggleDropdown()"
              class="flex items-center space-x-2 bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-slate-300/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-full text-sm backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              @if (currentLangOption(); as opt) {
                <img
                  [src]="flagUrls[opt.code]"
                  [alt]="i18n.t(opt.labelKey)"
                  class="w-5 h-3.5 object-cover rounded-xs shadow-xs"
                />
                <span class="font-medium hidden sm:inline">{{ i18n.t(opt.labelKey) }}</span>
              }
              <svg
                class="w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200"
                [class.rotate-180]="dropdownOpen()"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            @if (dropdownOpen()) {
              <div
                class="absolute right-0 mt-2 w-44 backdrop-blur-md bg-white/75 dark:bg-slate-900/75 border border-slate-200/60 dark:border-slate-700/60 rounded-lg shadow-xl py-1 z-50 transition-all"
              >
                @for (lang of i18n.supportedLanguages; track lang.code) {
                  <button
                    type="button"
                    (click)="selectLanguage(lang.code)"
                    class="w-full text-left px-4 py-2 text-sm flex items-center space-x-3 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                    [class.text-sky-600]="i18n.currentLang() === lang.code"
                    [class.dark:text-sky-400]="i18n.currentLang() === lang.code"
                    [class.text-slate-700]="i18n.currentLang() !== lang.code"
                    [class.dark:text-slate-300]="i18n.currentLang() !== lang.code"
                  >
                    <img
                      [src]="flagUrls[lang.code]"
                      [alt]="i18n.t(lang.labelKey)"
                      class="w-5 h-3.5 object-cover rounded-xs shadow-xs"
                    />
                    <span class="font-medium">{{ i18n.t(lang.labelKey) }}</span>
                  </button>
                }
              </div>
            }
          </div>

          <div class="animate-stagger-item flex items-center" [style.--i]="navItems.length + 2">
            <button
              type="button"
              (click)="theme.toggleTheme()"
              class="relative w-16 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              [class.track-inset-light]="theme.currentTheme() === 'light'"
              [class.track-inset-dark]="theme.currentTheme() === 'dark'"
              [attr.aria-label]="
                'Switch to ' + (theme.currentTheme() === 'dark' ? 'light' : 'dark') + ' mode'
              "
            >
              <span
                class="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none"
              >
                <svg
                  class="w-4 h-4 text-slate-300/70 transition-opacity duration-300"
                  [class.opacity-100]="theme.currentTheme() === 'dark'"
                  [class.opacity-0]="theme.currentTheme() === 'light'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="3.5" />
                  <path
                    d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
                  />
                </svg>
                <svg
                  class="w-4 h-4 text-slate-500/80 transition-opacity duration-300 ml-auto"
                  [class.opacity-100]="theme.currentTheme() === 'light'"
                  [class.opacity-0]="theme.currentTheme() === 'dark'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M11.5 3a8.5 8.5 0 0 0 9 12.5 9 9 0 1 1-9-12.5Z" />
                  <path
                    d="M19 3.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5Z"
                    fill="currentColor"
                    stroke="none"
                  />
                  <path
                    d="M15.5 7l.35.85.85.35-.85.35-.35.85-.35-.85-.85-.35.85-.35Z"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </span>
              <span
                class="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white knob-shadow transform transition-transform duration-300 ease-in-out"
                [class.translate-x-0]="theme.currentTheme() === 'light'"
                [class.translate-x-8]="theme.currentTheme() === 'dark'"
              >
                @if (theme.currentTheme() === 'light') {
                  <svg
                    class="w-3.5 h-3.5 text-amber-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="3.75" />
                    <path
                      d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.28 5.28l1.42 1.42M17.3 17.3l1.42 1.42M5.28 18.72l1.42-1.42M17.3 6.7l1.42-1.42"
                    />
                  </svg>
                } @else {
                  <svg class="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.5 3a8.5 8.5 0 0 0 9 12.5 9 9 0 1 1-9-12.5Z" />
                    <path d="M19 3.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5Z" />
                    <path d="M15.5 7l.35.85.85.35-.85.35-.35.85-.35-.85-.85-.35.85-.35Z" />
                  </svg>
                }
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  public i18n = inject(TranslationService);
  public theme = inject(ThemeService);
  public dropdownOpen = signal(false);
  public readonly avatarUrls = AVATAR_URLS;

  public readonly navItems: NavItem[] = [
    { path: '/', translationKey: 'navigation.home', exact: true },
    { path: '/about', translationKey: 'navigation.about' },
    { path: '/projects', translationKey: 'navigation.projects' },
    { path: '/blog', translationKey: 'navigation.blog' },
    { path: '/contact', translationKey: 'navigation.contact' },
  ];

  public readonly flagUrls: Record<SupportedLang, string> = {
    vi: 'https://flagcdn.com/vn.svg',
    en: 'https://flagcdn.com/gb.svg',
    ja: 'https://flagcdn.com/jp.svg',
    zh: 'https://flagcdn.com/cn.svg',
  };

  public currentLangOption = () =>
    this.i18n.supportedLanguages.find((l) => l.code === this.i18n.currentLang());

  public toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  public selectLanguage(code: SupportedLang): void {
    this.i18n.setLanguage(code);
    this.dropdownOpen.set(false);
  }
}
