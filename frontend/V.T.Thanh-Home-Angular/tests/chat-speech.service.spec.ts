import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatSpeechService } from '../src/features/chat/services/chat-speech.service';

class FakeRecognition {
  static instance: FakeRecognition;
  lang = '';
  continuous = false;
  interimResults = false;
  onresult:
    ((event: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    FakeRecognition.instance = this;
  }
}

describe('Chat speech', () => {
  let service: ChatSpeechService;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('SpeechRecognition', FakeRecognition);
    service = new ChatSpeechService();
  });
  afterEach(() => {
    service.ngOnDestroy();
    vi.unstubAllGlobals();
  });

  it('replaces interim results without duplication and preserves the typed prefix', () => {
    const update = vi.fn();
    service.startListening('kr', 'Hello', update);
    const recognition = FakeRecognition.instance;
    expect(recognition.lang).toBe('ko-KR');
    recognition.onresult?.({ results: [{ isFinal: false, 0: { transcript: 'world' } }] });
    expect(update).toHaveBeenLastCalledWith('Hello world');
    recognition.onresult?.({ results: [{ isFinal: true, 0: { transcript: 'world!' } }] });
    recognition.onend?.();
    expect(update).toHaveBeenLastCalledWith('Hello world!');
    expect(service.listening()).toBe(false);
  });

  it('ignores stale recognition callbacks after cancellation and keeps only final text', () => {
    const update = vi.fn();
    service.startListening('en', 'Draft', update);
    const recognition = FakeRecognition.instance;
    const lateResult = recognition.onresult;
    recognition.onresult?.({ results: [{ isFinal: false, 0: { transcript: 'temporary' } }] });
    service.reset();
    lateResult?.({ results: [{ isFinal: true, 0: { transcript: 'late' } }] });
    expect(update).toHaveBeenLastCalledWith('Draft');
    expect(recognition.abort).toHaveBeenCalled();
  });

  it('handles permission denial and caps the transcript at 1000 characters', () => {
    const update = vi.fn();
    service.startListening('en', '', update);
    FakeRecognition.instance.onresult?.({
      results: [{ isFinal: true, 0: { transcript: 'x'.repeat(1100) } }],
    });
    expect(update.mock.lastCall?.[0]).toHaveLength(1000);
    expect(FakeRecognition.instance.stop).toHaveBeenCalled();
    FakeRecognition.instance.onerror?.({ error: 'not-allowed' });
    expect(service.statusKey()).toBe('chat.voice_permission');
    expect(service.listening()).toBe(false);
  });
});
