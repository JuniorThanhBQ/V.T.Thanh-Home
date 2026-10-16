import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService, SupportedLang } from '@/shared/services/translation.service';
import { ThemeService } from '@/shared/services/theme.service';
import { AVATAR_URLS } from '@/assets/cloudinaryUrl';

export interface NavItem {
  path: string;
  label: string;
  exact?: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnDestroy {
  public i18n = inject(TranslationService);
  public theme = inject(ThemeService);
  public dropdownOpen = signal(false);
  public readonly avatarUrls = AVATAR_URLS;
  public isLangDropdownOpen = signal<boolean>(false);
  public isMobileMenuOpen = signal<boolean>(false);
  private elementRef = inject(ElementRef);

  private readonly rawNavConfig = [
    { rawPath: '', key: 'navigation.home', exact: true },
    { rawPath: 'about', key: 'navigation.about' },
    { rawPath: 'projects', key: 'navigation.projects' },
    { rawPath: 'blog', key: 'navigation.blog' },
    { rawPath: 'contact', key: 'navigation.contact' },
  ];

  public readonly navItems = computed<NavItem[]>(() => {
    const lang = this.i18n.currentLang();
    const prefix = lang === 'vi' ? '' : `/${lang}`;

    return this.rawNavConfig.map((item) => {
      const fullPath = item.rawPath ? `${prefix}/${item.rawPath}` : prefix || '/';
      return {
        path: fullPath,
        label: this.i18n.t(item.key),
        exact: item.exact,
      };
    });
  });

  public readonly logoPath = computed(() => {
    const lang = this.i18n.currentLang();
    return lang === 'vi' ? '/' : `/${lang}`;
  });

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

  public toggleMobileMenu(): void {
    const nextState = !this.isMobileMenuOpen();
    this.isMobileMenuOpen.set(nextState);
    if (nextState) {
      document.body.style.overflow = 'hidden';
      this.isLangDropdownOpen.set(false);
    } else {
      document.body.style.overflow = '';
    }
  }

  public closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
    document.body.style.overflow = '';
  }

  public toggleLangDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isLangDropdownOpen.update((open) => !open);
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
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
  public onEscapePress(): void {
    if (this.isLangDropdownOpen()) {
      this.isLangDropdownOpen.set(false);
    }
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }

  public toggleDropdown(): void {
    this.dropdownOpen.update((v) => !v);
  }

  public selectLanguage(code: SupportedLang): void {
    this.i18n.switchLanguage(code);
    this.dropdownOpen.set(false);
    this.isLangDropdownOpen.set(false);
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}
