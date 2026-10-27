import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SwUpdate, VersionEvent, UnrecoverableStateEvent } from '@angular/service-worker';
import { Subject, of } from 'rxjs';
import { signal } from '@angular/core';
import { BackendHealthService } from '@/shared/services/backend-health.service';
import { ConnectivityService } from '@/shared/services/connectivity.service';
import { PendingWorkService } from '@/shared/services/pending-work.service';
import { PwaLifecycleService } from '@/shared/services/pwa-lifecycle.service';
import { VisitorService } from '@/shared/services/visitor.service';
import { TurnstileService } from '@/shared/services/turnstile.service';
import { TranslationService } from '@/shared/services/translation.service';
import { ContactApiService } from '@/features/contact/services/contact-api.service';
import { ChatComponentService } from '@/features/chat/services/chat-component.service';
import { loadingInterceptor } from '@/shared/interceptors/loading.interceptor';
import { LoadingService } from '@/shared/services/loading.service';

describe('Backend connectivity', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('cancels health checks offline, pauses polling, and checks immediately on reconnection', async () => {
    const health = TestBed.inject(BackendHealthService);
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    const initial = http.expectOne('/actuator/health');
    window.dispatchEvent(new Event('offline'));
    TestBed.tick();
    expect(initial.cancelled).toBe(true);
    expect(health.connectionState()).toBe('offline');
    expect(health.available()).toBe(false);
    await vi.advanceTimersByTimeAsync(90000);
    http.expectNone('/actuator/health');
    window.dispatchEvent(new Event('online'));
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne('/actuator/health').flush({ status: 'UP' });
    expect(health.connectionState()).toBe('online');
    expect(health.available()).toBe(true);
  });

  it('distinguishes an unavailable backend from an offline device and permits manual recovery', async () => {
    const health = TestBed.inject(BackendHealthService);
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    http.expectOne('/actuator/health').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(health.connectionState()).toBe('unavailable');
    expect(health.connectivity.online()).toBe(true);
    health.checkHealth();
    http.expectOne('/actuator/health').flush({ status: 'UP' });
    expect(health.available()).toBe(true);
  });
});

describe('Interrupted delivery', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: VisitorService,
          useValue: { ensureRegistered: () => of({ registered: true }), invalidate: vi.fn() },
        },
        { provide: TurnstileService, useValue: { verify: () => of(undefined) } },
        { provide: BackendHealthService, useValue: { available: signal(true) } },
        { provide: TranslationService, useValue: { t: (key: string) => key } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('cancels contact delivery without automatic replay and reuses the key on explicit retry', () => {
    const service = TestBed.inject(ContactApiService);
    const connectivity = TestBed.inject(ConnectivityService);
    const pending = TestBed.inject(PendingWorkService);
    const payload = {
      firstName: 'Thanh',
      email: 'thanh@example.com',
      message: 'A test contact message',
    };
    const errors = vi.fn();
    pending.contactSending.set(true);
    service.submitContact(payload).subscribe({ error: errors });
    const first = http.expectOne('/api/v1/contacts');
    const key = first.request.body.idempotencyKey;
    window.dispatchEvent(new Event('offline'));
    expect(connectivity.online()).toBe(false);
    expect(first.cancelled).toBe(true);
    expect(errors).toHaveBeenCalledOnce();
    expect(pending.contactSending()).toBe(false);
    window.dispatchEvent(new Event('online'));
    http.expectNone('/api/v1/contacts');
    service.submitContact(payload).subscribe();
    const retry = http.expectOne('/api/v1/contacts');
    expect(retry.request.body.idempotencyKey).toBe(key);
    retry.flush({
      id: 1,
      status: 'ACCEPTED',
      message: 'Accepted',
      submittedAt: new Date().toISOString(),
    });
  });

  it('restores failed chat text and reuses the request ID only after explicit retry', () => {
    const service = TestBed.inject(ChatComponentService);
    service.sendMessage('Test message');
    const first = http.expectOne('/api/v1/chat/message');
    const id = first.request.body.requestId;
    window.dispatchEvent(new Event('offline'));
    expect(first.cancelled).toBe(true);
    expect(service.failedMessage()).toBe('Test message');
    expect(service.isSending()).toBe(false);
    window.dispatchEvent(new Event('online'));
    http.expectNone('/api/v1/chat/message');
    service.sendMessage('Test message');
    const retry = http.expectOne('/api/v1/chat/message');
    expect(retry.request.body.requestId).toBe(id);
    expect(service.messages().filter((message) => message.sender === 'user')).toHaveLength(1);
    retry.flush({ messageId: 1, reply: 'Received', timestamp: new Date().toISOString() });
    expect(service.failedMessage()).toBeNull();
    expect(service.isSending()).toBe(false);
  });

  it('rejects a contact operation before issuing HTTP requests when already offline', () => {
    const service = TestBed.inject(ContactApiService);
    TestBed.inject(ConnectivityService);
    window.dispatchEvent(new Event('offline'));
    const errors = vi.fn();
    service
      .submitContact({ firstName: 'Thanh', email: 'thanh@example.com', message: 'A test message' })
      .subscribe({ error: errors });
    expect(errors).toHaveBeenCalledOnce();
    http.expectNone('/api/v1/contacts');
  });
});

describe('PWA lifecycle safeguards', () => {
  let versions: Subject<VersionEvent>;
  let unrecoverable: Subject<UnrecoverableStateEvent>;

  beforeEach(() => {
    vi.useFakeTimers();
    const displayMode = Object.assign(new EventTarget(), { matches: false });
    vi.stubGlobal('matchMedia', () => displayMode);
    vi.stubGlobal('navigator', {
      onLine: true,
      serviceWorker: Object.assign(new EventTarget(), {
        controller: null,
        ready: new Promise(() => undefined),
        getRegistration: vi
          .fn()
          .mockResolvedValue({ update: vi.fn().mockResolvedValue(undefined) }),
      }),
    });
    versions = new Subject<VersionEvent>();
    unrecoverable = new Subject<UnrecoverableStateEvent>();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SwUpdate,
          useValue: {
            isEnabled: true,
            versionUpdates: versions,
            unrecoverable,
            checkForUpdate: vi.fn().mockResolvedValue(false),
          },
        },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('leaves an update pending and blocks reload during drafts or submissions', () => {
    const service = TestBed.inject(PwaLifecycleService);
    const work = TestBed.inject(PendingWorkService);
    work.contactDraft.set(true);
    versions.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'old' },
      latestVersion: { hash: 'new' },
    });
    expect(service.updateAvailable()).toBe(true);
    expect(service.canReload()).toBe(false);
    service.reload();
    work.contactDraft.set(false);
    work.chatSending.set(true);
    expect(service.canReload()).toBe(false);
    work.chatSending.set(false);
    expect(service.canReload()).toBe(true);
    window.dispatchEvent(new Event('offline'));
    expect(service.canReload()).toBe(false);
  });

  it('does not claim installation when a prompt is dismissed', async () => {
    const service = TestBed.inject(PwaLifecycleService);
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });
    window.dispatchEvent(event);
    expect(service.canInstall()).toBe(true);
    await service.install();
    expect(prompt).toHaveBeenCalledOnce();
    expect(service.installed()).toBe(false);
    expect(service.canInstall()).toBe(false);
    window.dispatchEvent(new Event('appinstalled'));
    expect(service.installed()).toBe(true);
    expect(service.isStandalone()).toBe(false);
  });

  it('refreshes the worker script during online update checks and skips it offline', async () => {
    const service = TestBed.inject(PwaLifecycleService);
    const registration = await navigator.serviceWorker.getRegistration();
    await service.checkForUpdate();
    expect(registration!.update).toHaveBeenCalledOnce();
    expect(TestBed.inject(SwUpdate).checkForUpdate).toHaveBeenCalledOnce();
    window.dispatchEvent(new Event('offline'));
    await service.checkForUpdate();
    expect(registration!.update).toHaveBeenCalledOnce();
  });

  it('tracks the active standalone window separately from installation', () => {
    const displayMode = Object.assign(new EventTarget(), { matches: true });
    vi.stubGlobal('matchMedia', () => displayMode);
    const service = TestBed.inject(PwaLifecycleService);
    expect(service.isStandalone()).toBe(true);
    expect(service.installed()).toBe(true);
    displayMode.matches = false;
    displayMode.dispatchEvent(new Event('change'));
    expect(service.isStandalone()).toBe(false);
    expect(service.installed()).toBe(true);
  });

  it('exposes recovery without automatically reloading or discarding a draft', () => {
    const service = TestBed.inject(PwaLifecycleService);
    TestBed.inject(PendingWorkService).chatDraft.set(true);
    unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'Missing bundle' });
    expect(service.unrecoverable()).toBe(true);
    expect(service.readiness()).toBe('incomplete');
    expect(service.canReload()).toBe(false);
  });

  it('queues a new readiness scan when a cached resource disappears during an existing scan', async () => {
    let present = true;
    let releaseDigest!: (value: ArrayBuffer) => void;
    let markStarted!: () => void;
    const started = new Promise<void>((accept) => {
      markStarted = accept;
    });
    const digest = new Promise<ArrayBuffer>((accept) => {
      releaseDigest = accept;
    });
    const receipt = JSON.stringify({
      entryScripts: ['/pwa-unit-entry.js'],
      resources: [{ url: '/pwa-unit-entry.js', sha256: '0'.repeat(64) }],
    });
    const cache = {
      match: vi.fn(async (url: string) =>
        url.endsWith('/pwa-resources.json')
          ? { ok: true, text: async () => receipt }
          : present
            ? { ok: true, arrayBuffer: async () => new ArrayBuffer(1) }
            : undefined,
      ),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => receipt }));
    vi.stubGlobal('caches', { keys: async () => ['unit-cache'], open: async () => cache });
    vi.stubGlobal('crypto', {
      subtle: {
        digest: vi.fn(() => {
          markStarted();
          return digest;
        }),
      },
    });
    const script = document.createElement('script');
    script.src = '/pwa-unit-entry.js';
    document.body.appendChild(script);
    try {
      const service = TestBed.inject(PwaLifecycleService);
      Object.assign(navigator.serviceWorker, { controller: {} });
      const first = service.verifyOfflineResources();
      await started;
      present = false;
      await service.verifyOfflineResources();
      releaseDigest(new Uint8Array(32).buffer);
      await first;
      await vi.waitFor(() => expect(service.readiness()).toBe('incomplete'));
      expect(
        cache.match.mock.calls.filter(([url]) => url.endsWith('/pwa-unit-entry.js')),
      ).toHaveLength(2);
    } finally {
      script.remove();
    }
  });
});

describe('Background and challenge cleanup', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('keeps background API checks outside the global loader while retaining asset loading tracking', () => {
    const loader = { incrementInflight: vi.fn(), decrementInflight: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
        { provide: LoadingService, useValue: loader },
      ],
    });
    const client = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);
    for (const path of ['/actuator/health', '/api/viewers', '/api/v1/visitors']) {
      client.get(path).subscribe();
      http.expectOne(path).flush({});
    }
    expect(loader.incrementInflight).not.toHaveBeenCalled();
    expect(loader.decrementInflight).not.toHaveBeenCalled();
    client.get('/i18n/en.json').subscribe();
    expect(loader.incrementInflight).toHaveBeenCalledOnce();
    http.expectOne('/i18n/en.json').flush({});
    expect(loader.decrementInflight).toHaveBeenCalledOnce();
  });

  it('removes an active security challenge when connectivity is lost', async () => {
    const api = { render: vi.fn().mockReturnValue('widget'), execute: vi.fn(), remove: vi.fn() };
    vi.stubGlobal('turnstile', api);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const errors = vi.fn();
    TestBed.inject(TurnstileService).verify('contact').subscribe({ error: errors });
    http.expectOne('/api/v1/security/config').flush({ turnstileSiteKey: 'test-site-key' });
    await Promise.resolve();
    await Promise.resolve();
    expect(api.render).toHaveBeenCalledOnce();
    const container = api.render.mock.calls[0][0];
    expect(document.body.contains(container)).toBe(true);
    window.dispatchEvent(new Event('offline'));
    await Promise.resolve();
    expect(errors).toHaveBeenCalledOnce();
    expect(api.remove).toHaveBeenCalledWith('widget');
    expect(document.body.contains(container)).toBe(false);
  });
});
