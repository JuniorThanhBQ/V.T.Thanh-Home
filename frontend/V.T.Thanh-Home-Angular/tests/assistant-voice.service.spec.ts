import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssistantVoiceService } from '../src/features/chat/services/assistant-voice.service';
import { PLATFORM_ID } from '@angular/core';

class FakeAudio {
  static instance: FakeAudio;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onplaying: (() => void) | null = null;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn();
  constructor() {
    FakeAudio.instance = this;
  }
}

class FakeAudioContext {
  static instance: FakeAudioContext;
  currentTime = 0;
  destination = {};
  resume = vi.fn(async () => undefined);
  close = vi.fn(async () => undefined);
  samples?: Float32Array;
  source = {
    start: vi.fn(),
    stop: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    onended: null as (() => void) | null,
  };
  constructor() {
    FakeAudioContext.instance = this;
  }
  createBuffer(_channels: number, count: number, rate: number) {
    this.samples = new Float32Array(count);
    return { duration: count / rate, getChannelData: () => this.samples };
  }
  createBufferSource() {
    return this.source;
  }
}

function frame(payload: object): string {
  return `data: ${JSON.stringify(payload)}\r\n\r\n`;
}

const start = { type: 'start', format: 's16le', rate: 24000, channels: 1 };

describe('Gemini assistant voice', () => {
  let service: AssistantVoiceService;
  let http: HttpTestingController;
  const revoke = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('AudioContext', undefined);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revoke);
    TestBed.configureTestingModule({
      providers: [AssistantVoiceService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AssistantVoiceService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    service.stop();
    http.verify();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('requests only the persisted reply ID and releases audio on completion', () => {
    service.speak('b-request-1');
    expect(service.initializingId()).toBe('b-request-1');
    const request = http.expectOne('/api/v1/chat/speech/request-1');
    expect(request.request.body).toEqual({});
    request.flush(new Blob(['wav'], { type: 'audio/wav' }));
    expect(FakeAudio.instance.play).toHaveBeenCalled();
    expect(service.initializingId()).toBe('b-request-1');
    FakeAudio.instance.onplaying?.();
    expect(service.initializingId()).toBeNull();
    FakeAudio.instance.onended?.();
    expect(service.speakingId()).toBeNull();
    expect(revoke).toHaveBeenCalledWith('blob:test');
  });

  it('cancels an in-flight request when stopped', () => {
    service.speak('b-request-2');
    const request = http.expectOne('/api/v1/chat/speech/request-2');
    service.stop();
    expect(request.cancelled).toBe(true);
    expect(service.speakingId()).toBeNull();
  });

  it('exposes retry failure on quota exhaustion without changing chat messages', () => {
    service.speak('b-request-3');
    http
      .expectOne('/api/v1/chat/speech/request-3')
      .flush(new Blob(), { status: 503, statusText: 'Unavailable' });
    expect(service.failedId()).toBe('b-request-3');
    expect(service.initializingId()).toBeNull();
    service.speak('b-request-3');
    expect(service.failedId()).toBeNull();
    expect(service.initializingId()).toBe('b-request-3');
    http.expectOne('/api/v1/chat/speech/request-3').flush(new Blob(['wav']));
    FakeAudio.instance.onplaying?.();
    expect(service.initializingId()).toBeNull();
    expect(service.speakingId()).toBe('b-request-3');
  });

  function mockStream() {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    let stream!: ReadableStreamDefaultController<Uint8Array>;
    const response = new Response(new ReadableStream<Uint8Array>({
      start: (controller) => { stream = controller; },
    }), { headers: { 'Content-Type': 'text/event-stream' } });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);
    return {
      fetchMock,
      send: (text: string) => stream.enqueue(new TextEncoder().encode(text)),
      close: () => stream.close(),
    };
  }

  it('starts before EOF, rejoins split PCM samples, and aborts on replacement', async () => {
    const { fetchMock, send } = mockStream();
    document.cookie = 'XSRF-TOKEN=voice-test; path=/';
    try {
      service.speak('b-streamed');
      const context = FakeAudioContext.instance;
      expect(context.resume).toHaveBeenCalled();
      const metadata = frame(start);
      send(metadata.slice(0, -3));
      send(metadata.slice(-3) + frame({ type: 'audio', seq: 0, data: '/w==' }));
      send(frame({ type: 'audio', seq: 1, data: btoa('\x7f' + '\0'.repeat(5758)) }));
      await vi.waitFor(() => expect(context.source.start).toHaveBeenCalledTimes(1));
      expect(context.samples?.[0]).toBeCloseTo(32767 / 32768);
      expect(service.initializingId()).toBeNull();
      const [url, request] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/v1/chat/speech/streamed/stream');
      expect(request?.method).toBe('POST');
      expect(request?.credentials).toBe('same-origin');
      expect(new Headers(request?.headers).get('X-XSRF-TOKEN')).toBe('voice-test');
      vi.stubGlobal('AudioContext', undefined);
      service.speak('b-replacement');
      expect(request?.signal?.aborted).toBe(true);
      expect(context.source.stop).toHaveBeenCalled();
      expect(context.close).toHaveBeenCalled();
      await Promise.resolve();
      expect(service.speakingId()).toBe('b-replacement');
      http.expectOne('/api/v1/chat/speech/replacement').flush(new Blob(['wav']));
    } finally {
      document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
    }
  });

  it.each([
    frame({ ...start, rate: 16000 }),
    frame(start) + frame({ type: 'done', chunks: 0 }),
    frame(start) + frame({ type: 'audio', seq: 0, data: 'AA==' }) + frame({ type: 'done', chunks: 1 }),
    frame(start) + frame({ type: 'audio', seq: 1, data: 'AAA=' }),
    frame(start),
  ])('rejects malformed or incomplete streaming audio', async (wire) => {
    const { send, close } = mockStream();
    service.speak('b-invalid');
    send(wire);
    close();
    await vi.waitFor(() => expect(service.failedId()).toBe('b-invalid'));
    http.expectNone('/api/v1/chat/speech/invalid');
  });

  it('reports a failed partial stream without replaying the whole reply', async () => {
    const { send } = mockStream();
    service.speak('b-partial');
    send(frame(start) + frame({ type: 'audio', seq: 0, data: btoa('\0'.repeat(5760)) }));
    await vi.waitFor(() => expect(service.initializingId()).toBeNull());
    send(frame({ type: 'error', status: 429 }));
    await vi.waitFor(() => expect(service.failedId()).toBe('b-partial'));
    expect(FakeAudioContext.instance.source.stop).toHaveBeenCalled();
    http.expectNone('/api/v1/chat/speech/partial');
  });

  it('falls back to WAV when the streaming switch is disabled', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 501 }));
    vi.stubGlobal('fetch', fetchMock);
    service.speak('b-rollback');
    await vi.waitFor(() => expect(FakeAudioContext.instance.close).toHaveBeenCalled());
    http.expectOne('/api/v1/chat/speech/rollback').flush(new Blob(['wav']));
    expect(FakeAudio.instance.play).toHaveBeenCalled();
  });
});

it('does not touch browser playback on SSR', () => {
  TestBed.configureTestingModule({
    providers: [
      AssistantVoiceService,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PLATFORM_ID, useValue: 'server' },
    ],
  });
  const service = TestBed.inject(AssistantVoiceService);
  service.speak('b-server');
  expect(service.speakingId()).toBeNull();
  TestBed.inject(HttpTestingController).verify();
  TestBed.resetTestingModule();
});
