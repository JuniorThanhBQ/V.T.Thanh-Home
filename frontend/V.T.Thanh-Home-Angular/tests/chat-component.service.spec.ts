import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ChatComponentService } from '../src/features/chat/services/chat-component.service';
import { VisitorService } from '../src/shared/services/visitor.service';
import { TurnstileService } from '../src/shared/services/turnstile.service';
import { TranslationService } from '../src/shared/services/translation.service';
import { BackendHealthService } from '../src/shared/services/backend-health.service';
import { ConnectivityService } from '../src/shared/services/connectivity.service';
import { PendingWorkService } from '../src/shared/services/pending-work.service';

const tick = () => new Promise((resolve) => setTimeout(resolve, 70));

describe('Streaming chat service', () => {
  let service: ChatComponentService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: VisitorService, useValue: { ensureRegistered: () => of(true) } },
        { provide: TurnstileService, useValue: { verify: () => of('challenge') } },
        { provide: TranslationService, useValue: { t: (key: string) => key } },
        { provide: BackendHealthService, useValue: { available: () => true } },
        {
          provide: ConnectivityService,
          useValue: { requireOnline: () => (source: unknown) => source },
        },
        { provide: PendingWorkService, useValue: { chatSending: signal(false) } },
      ],
    });
    service = TestBed.inject(ChatComponentService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    service.cancel();
    http.verify();
    TestBed.resetTestingModule();
  });

  it('renders a delta before completion and replaces it with the persisted answer', async () => {
    service.sendMessage('Hello');
    const request = http.expectOne('/api/v1/chat/message/stream');
    expect(request.request.reportDownloadProgress).toBe(true);
    const partial = 'event: start\ndata: {}\n\nevent: delta\ndata: {"text":"Hi"}\n\n';
    request.event({
      type: HttpEventType.DownloadProgress,
      loaded: partial.length,
      partialText: partial,
    });
    await tick();
    expect(service.messages()[1].text).toBe('Hi');
    expect(service.isSending()).toBe(true);
    request.flush(
      partial +
        'event: done\ndata: {"messageId":1,"reply":"Hi Thanh","timestamp":"2026-11-01T00:00:00Z"}\n\n',
    );
    await tick();
    expect(service.messages()[1].text).toBe('Hi Thanh');
    expect(service.messages()[1].state).toBe('completed');
    expect(service.isSending()).toBe(false);
  });

  it('marks an EOF without done as interrupted and reuses the request ID on retry', async () => {
    service.sendMessage('Hello');
    const request = http.expectOne('/api/v1/chat/message/stream');
    const id = request.request.body.requestId;
    request.flush('event: delta\ndata: {"text":"partial"}\n\n');
    await tick();
    expect(service.messages()[1].state).toBe('interrupted');
    expect(service.failedMessage()).toBe('Hello');
    service.sendMessage('Hello');
    const retry = http.expectOne('/api/v1/chat/message/stream');
    expect(retry.request.body.requestId).toBe(id);
    service.cancel();
    expect(retry.cancelled).toBe(true);
    expect(service.isSending()).toBe(false);
  });
});
