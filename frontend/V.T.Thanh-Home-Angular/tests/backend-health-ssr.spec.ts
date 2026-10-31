import { afterEach, describe, expect, it, vi } from 'vitest';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BackendHealthService } from '@/shared/services/backend-health.service';

describe('Backend health during server rendering', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('keeps health unknown without polling or manual HTTP requests on the server', async () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const health = TestBed.inject(BackendHealthService);
    const http = TestBed.inject(HttpTestingController);
    TestBed.tick();
    health.checkHealth();
    await vi.advanceTimersByTimeAsync(90000);
    expect(health.status()).toBe('UNKNOWN');
    expect(health.isHealthy()).toBeNull();
    expect(health.available()).toBe(false);
    expect(health.checking()).toBe(false);
    expect(health.lastChecked()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    http.expectNone(() => true);
    http.verify();
  });
});
