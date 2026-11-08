import { isPlatformBrowser } from '@angular/common';
import { Injectable, Injector, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpXsrfTokenExtractor } from '@angular/common/http';
import { Observable, Subscription, timeout } from 'rxjs';
import { BackendHealthService } from '@/shared/services/backend-health.service';
import { ConnectivityService } from '@/shared/services/connectivity.service';
import { readSpeechStream, SpeechPlayback } from './speech-playback';

@Injectable()
export class AssistantVoiceService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly xsrf = inject(HttpXsrfTokenExtractor);
  private readonly connectivity = inject(ConnectivityService);
  private readonly injector = inject(Injector);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  public readonly speakingId = signal<string | null>(null);
  public readonly initializingId = signal<string | null>(null);
  public readonly error = signal(false);
  public readonly failedId = signal<string | null>(null);
  private request?: Subscription;
  private playback?: SpeechPlayback;
  private audio?: HTMLAudioElement;
  private objectUrl?: string;
  private version = 0;

  public speak(id: string): void {
    this.stop();
    if (!this.browser || !/^b-[a-zA-Z0-9_-]{1,64}$/.test(id)) return;
    this.error.set(false);
    this.failedId.set(null);
    const version = this.version;
    this.speakingId.set(id);
    this.initializingId.set(id);
    const url = `/api/v1/chat/speech/${encodeURIComponent(id.slice(2))}`;
    if (
      typeof AudioContext !== 'undefined' &&
      typeof fetch !== 'undefined' &&
      typeof ReadableStream !== 'undefined'
    ) {
      this.playStream(url, version);
    } else {
      this.playWav(url, version);
    }
  }

  private playStream(url: string, version: number): void {
    let playback: SpeechPlayback;
    try {
      playback = new SpeechPlayback(
        () => {
          if (version === this.version) this.initializingId.set(null);
        },
        () => {
          if (version === this.version) this.stop();
        },
      );
    } catch {
      this.playWav(url, version);
      return;
    }
    this.playback = playback;
    this.request = new Observable<boolean>((subscriber) => {
      const controller = new AbortController();
      void playback
        .resume()
        .then(
          () => this.fetchSpeech(url, controller.signal, playback),
          () => false,
        )
        .then(
          (streamed) => {
            subscriber.next(streamed);
            subscriber.complete();
          },
          (error: unknown) => subscriber.error(error),
        );
      return () => controller.abort();
    })
      .pipe(this.connectivity.requireOnline(), timeout(47000))
      .subscribe({
        next: (streamed) => {
          if (streamed || version !== this.version) return;
          playback.close();
          this.playback = undefined;
          this.playWav(url, version);
        },
        error: (error: unknown) => {
          if (version !== this.version) return;
          if (
            this.connectivity.online() &&
            error instanceof HttpErrorResponse &&
            [0, 502, 503, 504].includes(error.status)
          ) {
            const health = this.injector.get(BackendHealthService);
            if (health.status() === 'UP') health.checkHealth();
          }
          this.fail(version);
        },
      });
  }

  private async fetchSpeech(
    url: string,
    signal: AbortSignal,
    playback: SpeechPlayback,
  ): Promise<boolean> {
    if (signal.aborted) return true;
    const headers = new Headers({ Accept: 'text/event-stream, application/json' });
    const token = this.xsrf.getToken();
    if (token) headers.set('X-XSRF-TOKEN', token);
    const response = await fetch(`${url}/stream`, {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      redirect: 'error',
      signal,
    }).catch(() => {
      throw new HttpErrorResponse({ status: 0 });
    });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('text/event-stream')) {
      void response.body?.cancel().catch(() => undefined);
      if (response.status === 501 || response.status === 405) return false;
      throw new HttpErrorResponse({ status: response.status });
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Missing speech stream');
    try {
      await readSpeechStream(reader, playback, (status) => {
        throw new HttpErrorResponse({ status });
      });
    } finally {
      void reader.cancel().catch(() => undefined);
    }
    return true;
  }

  private playWav(url: string, version: number): void {
    if (typeof Audio === 'undefined') {
      this.fail(version);
      return;
    }
    this.request = this.http
      .post(url, {}, { responseType: 'blob' })
      .pipe(timeout(45000))
      .subscribe({
        next: (blob) => {
          if (version !== this.version) return;
          this.objectUrl = URL.createObjectURL(blob);
          const audio = new Audio(this.objectUrl);
          this.audio = audio;
          audio.onended = () => {
            if (version === this.version) this.stop();
          };
          audio.onplaying = () => {
            if (version === this.version) this.initializingId.set(null);
          };
          audio.onerror = () => this.fail(version);
          void audio.play().catch(() => this.fail(version));
        },
        error: () => this.fail(version),
      });
  }

  private fail(version: number): void {
    if (version !== this.version) return;
    const id = this.speakingId();
    this.stop();
    this.failedId.set(id);
    this.error.set(true);
  }

  public stop(): void {
    this.version++;
    this.request?.unsubscribe();
    this.request = undefined;
    this.playback?.close();
    this.playback = undefined;
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.onplaying = null;
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = undefined;
    }
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = undefined;
    this.speakingId.set(null);
    this.initializingId.set(null);
    this.error.set(false);
    this.failedId.set(null);
  }

  public ngOnDestroy(): void {
    this.stop();
  }
}
