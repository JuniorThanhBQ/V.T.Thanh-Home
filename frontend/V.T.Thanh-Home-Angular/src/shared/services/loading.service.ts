import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, DestroyRef, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  public readonly isLoading = signal<boolean>(true);
  public readonly loadingText = signal<string>('Syncing Core Systems');

  private inflightCount = signal<number>(0);
  private startTime = performance.now();
  private readonly minDuration = 1000;
  private readonly maxTimeout = 4000;
  private timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timeoutHandle));
    this.armSafetyTimeout();
  }

  public show(text = 'Syncing...'): void {
    clearTimeout(this.timeoutHandle);
    this.startTime = performance.now();
    this.loadingText.set(text);
    this.isLoading.set(true);
    this.armSafetyTimeout();
  }

  public hide(): void {
    if (!this.isBrowser) {
      this.isLoading.set(false);
      return;
    }
    clearTimeout(this.timeoutHandle);
    const elapsed = performance.now() - this.startTime;
    const remaining = Math.max(0, this.minDuration - elapsed);

    this.timeoutHandle = setTimeout(() => {
      this.isLoading.set(false);
      clearTimeout(this.timeoutHandle);
    }, remaining);
  }

  public incrementInflight(): void {
    this.inflightCount.update((c) => c + 1);
  }

  public decrementInflight(): void {
    this.inflightCount.update((c) => Math.max(0, c - 1));
    if (this.inflightCount() <= 0) {
      this.hide();
    }
  }

  private armSafetyTimeout(): void {
    if (!this.isBrowser) return;
    this.timeoutHandle = setTimeout(() => {
      if (this.isLoading()) {
        this.isLoading.set(false);
      }
    }, this.maxTimeout);
  }
}
