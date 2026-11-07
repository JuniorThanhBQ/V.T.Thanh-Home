import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { ConsentService } from '../src/shared/services/consent.service';

describe('ConsentService', () => {
  let service: ConsentService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ConsentService],
    });
    service = TestBed.inject(ConsentService);
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('initializes with undecided state when localStorage is empty', () => {
    expect(service.hasDecided()).toBe(false);
    expect(service.analyticsAllowed()).toBe(false);
    expect(service.isBannerVisible()).toBe(true);
  });

  it('persists preferences and closes banner when accepting all', () => {
    service.acceptAll();
    expect(service.hasDecided()).toBe(true);
    expect(service.analyticsAllowed()).toBe(true);
    expect(service.isBannerVisible()).toBe(false);

    const stored = JSON.parse(localStorage.getItem('vtthanh_consent_v1') || '{}');
    expect(stored.essential).toBe(true);
    expect(stored.analytics).toBe(true);
    expect(stored.decidedAt).toBeTruthy();
  });

  it('persists essential only when declining non-essential', () => {
    service.declineNonEssential();
    expect(service.hasDecided()).toBe(true);
    expect(service.analyticsAllowed()).toBe(false);
    expect(service.isBannerVisible()).toBe(false);

    const stored = JSON.parse(localStorage.getItem('vtthanh_consent_v1') || '{}');
    expect(stored.essential).toBe(true);
    expect(stored.analytics).toBe(false);
    expect(stored.decidedAt).toBeTruthy();
  });

  it('allows reopening banner to modify preferences', () => {
    service.acceptAll();
    expect(service.isBannerVisible()).toBe(false);

    service.openBanner();
    expect(service.isBannerVisible()).toBe(true);

    service.closeBanner();
    expect(service.isBannerVisible()).toBe(false);
  });
});
