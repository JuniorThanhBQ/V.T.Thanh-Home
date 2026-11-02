import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssistantVoiceService } from '../src/features/chat/services/assistant-voice.service';

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

describe('Gemini assistant voice', () => {
  let service: AssistantVoiceService;
  let http: HttpTestingController;
  const revoke = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('Audio', FakeAudio);
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
});
