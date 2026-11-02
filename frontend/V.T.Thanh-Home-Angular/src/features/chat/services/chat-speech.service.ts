import { Injectable, OnDestroy, signal } from '@angular/core';

interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export const SPEECH_LOCALES: Record<string, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  kr: 'ko-KR',
  ru: 'ru-RU',
};

@Injectable()
export class ChatSpeechService implements OnDestroy {
  public readonly recognitionSupported = signal(false);
  public readonly listening = signal(false);
  public readonly statusKey = signal<string | null>(null);
  private recognition?: Recognition;
  private commitDraft?: () => void;
  private initialized = false;

  public initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    const scope = window as SpeechWindow;
    this.recognitionSupported.set(!!(scope.SpeechRecognition ?? scope.webkitSpeechRecognition));
  }

  public startListening(language: string, draft: string, update: (text: string) => void): void {
    this.initialize();
    this.reset();
    const scope = typeof window === 'undefined' ? undefined : (window as SpeechWindow);
    const Constructor = scope?.SpeechRecognition ?? scope?.webkitSpeechRecognition;
    if (!Constructor) {
      this.statusKey.set('chat.voice_input_unavailable');
      return;
    }
    const recognition = new Constructor();
    this.recognition = recognition;
    recognition.lang = SPEECH_LOCALES[language] ?? 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    const prefix = draft.trimEnd();
    let finalText = prefix;
    this.commitDraft = () => update(finalText);
    let received = false;
    recognition.onresult = (event) => {
      if (this.recognition !== recognition) return;
      const final: string[] = [];
      const interim: string[] = [];
      for (const result of Array.from(event.results)) {
        (result.isFinal ? final : interim).push(result[0].transcript);
      }
      const join = (parts: string[]) => [prefix, ...parts].filter(Boolean).join(' ').slice(0, 1000);
      finalText = join(final);
      received ||= final.length > 0;
      update(join([...final, ...interim]));
      if (join([...final, ...interim]).length >= 1000) this.stopListening();
    };
    recognition.onerror = ({ error }) => {
      if (this.recognition !== recognition) return;
      const key =
        error === 'not-allowed' || error === 'service-not-allowed'
          ? 'voice_permission'
          : error === 'audio-capture'
            ? 'voice_microphone'
            : error === 'no-speech'
              ? 'voice_no_speech'
              : 'voice_input_error';
      this.statusKey.set(`chat.${key}`);
      this.detachRecognition();
      update(finalText);
    };
    recognition.onend = () => {
      if (this.recognition !== recognition) return;
      this.detachRecognition(false);
      update(finalText);
      this.statusKey.set(received ? null : 'chat.voice_no_speech');
    };
    this.listening.set(true);
    this.statusKey.set('chat.voice_listening');
    try {
      recognition.start();
    } catch {
      this.detachRecognition();
      this.statusKey.set('chat.voice_input_error');
    }
  }

  public stopListening(): void {
    if (!this.recognition) return;
    this.statusKey.set('chat.voice_processing');
    try {
      this.recognition.stop();
    } catch {
      this.detachRecognition();
      this.statusKey.set('chat.voice_input_error');
    }
  }

  private detachRecognition(abort = true): void {
    const recognition = this.recognition;
    this.recognition = undefined;
    const commitDraft = this.commitDraft;
    this.commitDraft = undefined;
    commitDraft?.();
    this.listening.set(false);
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    if (abort) {
      try {
        recognition.abort();
      } catch {
        return;
      }
    }
  }

  public reset(): void {
    this.detachRecognition();
    this.statusKey.set(null);
  }

  public ngOnDestroy(): void {
    this.reset();
  }
}
