import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, timeout } from 'rxjs';

@Injectable()
export class AssistantVoiceService implements OnDestroy {
  private readonly http = inject(HttpClient);
  public readonly speakingId = signal<string | null>(null);
  public readonly initializingId = signal<string | null>(null);
  public readonly error = signal(false);
  public readonly failedId = signal<string | null>(null);
  private request?: Subscription;
  private audio?: HTMLAudioElement;
  private objectUrl?: string;
  private version = 0;

  public speak(id: string): void {
    this.stop();
    if (typeof Audio === 'undefined' || !id.startsWith('b-')) return;
    this.error.set(false);
    this.failedId.set(null);
    const version = this.version;
    this.speakingId.set(id);
    this.initializingId.set(id);
    this.request = this.http
      .post(`/api/v1/chat/speech/${encodeURIComponent(id.slice(2))}`, {}, { responseType: 'blob' })
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
