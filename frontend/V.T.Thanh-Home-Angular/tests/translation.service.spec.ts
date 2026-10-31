import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Component, inject, TransferState, makeStateKey } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { TranslationService } from '@/shared/services/translation.service';
import { LoadingService } from '@/shared/services/loading.service';

@Component({ template: '' })
class LanguageHost {
  readonly i18n = inject(TranslationService);
}

describe('Initial language detection', () => {
  let path: string;
  let events: Subject<NavigationEnd>;
  let navigate: ReturnType<typeof vi.fn>;
  let http: HttpTestingController;

  beforeEach(() => {
    path = '/';
    events = new Subject<NavigationEnd>();
    navigate = vi.fn().mockResolvedValue(true);
    localStorage.setItem('app_language', 'en');
    TestBed.configureTestingModule({
      imports: [LanguageHost],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Location, useValue: { path: () => path } },
        { provide: Router, useValue: { events, navigateByUrl: navigate } },
        { provide: LoadingService, useValue: { show: vi.fn(), hide: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('app_language');
    vi.restoreAllMocks();
  });

  it('uses Vietnamese initially at root and restores the saved language after rendering', () => {
    const fixture = TestBed.createComponent(LanguageHost);
    expect(fixture.componentInstance.i18n.currentLang()).toBe('vi');
    expect(navigate).not.toHaveBeenCalled();
    http.expectOne('/i18n/vi.json').flush({});
    events.next(new NavigationEnd(1, '/', '/'));
    expect(navigate).not.toHaveBeenCalled();
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith('/en', { replaceUrl: true });
    http.expectOne('/i18n/en.json').flush({});
  });

  it('preserves an explicit language prefix instead of restoring another preference', () => {
    path = '/fr/about';
    const fixture = TestBed.createComponent(LanguageHost);
    expect(fixture.componentInstance.i18n.currentLang()).toBe('fr');
    http.expectOne('/i18n/fr.json').flush({});
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.componentInstance.i18n.currentLang()).toBe('fr');
  });

  it('uses the server dictionary during hydration without another HTTP request', () => {
    path = '/en/about';
    TestBed.inject(TransferState).set(makeStateKey<Record<string, unknown>>('dictionary-en'), {
      navigation: { home: 'Home' },
    });
    const fixture = TestBed.createComponent(LanguageHost);
    expect(fixture.componentInstance.i18n.currentLang()).toBe('en');
    expect(fixture.componentInstance.i18n.t('navigation.home')).toBe('Home');
    http.expectNone('/i18n/en.json');
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not read browser language preferences before rendering', () => {
    localStorage.removeItem('app_language');
    const languages = vi.spyOn(navigator, 'languages', 'get');
    const fixture = TestBed.createComponent(LanguageHost);
    expect(fixture.componentInstance.i18n.currentLang()).toBe('vi');
    expect(languages).not.toHaveBeenCalled();
    http.expectOne('/i18n/vi.json').flush({});
  });
});
