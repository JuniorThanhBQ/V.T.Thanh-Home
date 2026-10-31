import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { connectivityInterceptor } from '@/shared/interceptors/connectivity.interceptor';
import { ConnectivityService } from '@/shared/services/connectivity.service';
import { BackendHealthService } from '@/shared/services/backend-health.service';

describe('Connectivity interceptor URL handling', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let checkHealth: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    checkHealth = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([connectivityInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: BackendHealthService, useValue: { status: signal('UP'), checkHealth } },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    http.verify();
    TestBed.resetTestingModule();
  });

  it.each([
    '/api/v1/projects?published=true',
    'api/v1/projects',
    'https://backend.example/api/v1/projects',
    '//backend.example/api/v1/projects',
  ])('handles %s without browser globals and preserves the outgoing URL', (url) => {
    vi.stubGlobal('location', undefined);
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('navigator', undefined);
    const failure = vi.fn();
    client.get(url).subscribe({ error: failure });
    expect(TestBed.inject(ConnectivityService).online()).toBe(true);
    http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(failure).toHaveBeenCalledWith(expect.any(HttpErrorResponse));
    expect(checkHealth).toHaveBeenCalledOnce();
  });

  it.each(['/i18n/vi.json', '/actuator/health', '/apiary', '/assets/icon.svg?next=/api/v1'])(
    'bypasses connectivity handling for %s',
    (url) => {
      vi.stubGlobal('location', undefined);
      const failure = vi.fn();
      client.get(url).subscribe({ error: failure });
      http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
      expect(failure).toHaveBeenCalledWith(expect.any(HttpErrorResponse));
      expect(checkHealth).not.toHaveBeenCalled();
    },
  );

  it('keeps browser offline requests from reaching the HTTP backend', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([connectivityInterceptor])),
        provideHttpClientTesting(),
        { provide: BackendHealthService, useValue: { status: signal('UP'), checkHealth } },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(ConnectivityService).online.set(false);
    const failure = vi.fn();
    client.get('/api/v1/projects').subscribe({ error: failure });
    http.expectNone('/api/v1/projects');
    expect(failure).toHaveBeenCalledWith(expect.objectContaining({ status: 0 }));
    expect(checkHealth).not.toHaveBeenCalled();
  });
});
