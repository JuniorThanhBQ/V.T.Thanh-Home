import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
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
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  public i18n = inject(TranslationService);
  public theme = inject(ThemeService);
  public dropdownOpen = signal(false);
  public readonly avatarUrls = AVATAR_URLS;
  isLangDropdownOpen = signal<boolean>(false);
  private elementRef = inject(ElementRef);

  toggleLangDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isLangDropdownOpen.update((open) => !open);
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isLangDropdownOpen()) {
      const clickedInside = this.elementRef.nativeElement
        .querySelector('.lang-dropdown-container')
        ?.contains(event.target as Node);
      if (!clickedInside) {
        this.isLangDropdownOpen.set(false);
      }
    }
  }
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isLangDropdownOpen()) {
      this.isLangDropdownOpen.set(false);
    }
  }

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
    fr: 'https://flagcdn.com/fr.svg',
    de: 'https://flagcdn.com/de.svg',
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
