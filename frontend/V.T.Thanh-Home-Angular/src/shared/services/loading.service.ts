import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  public readonly isLoading = signal<boolean>(true);
  public readonly loadingText = signal<string>('Syncing Core Systems');

  private inflightCount = signal<number>(0);
  private startTime = performance.now();
  private readonly minDuration = 550;
  private readonly maxTimeout = 2500;
  private timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  constructor() {
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
    const elapsed = performance.now() - this.startTime;
    const remaining = Math.max(0, this.minDuration - elapsed);

    setTimeout(() => {
      this.isLoading.set(false);
      clearTimeout(this.timeoutHandle);
    }, remaining);
  }

  public incrementInflight(): void {
    this.inflightCount.update((c) => c + 1);
  }

  public decrementInflight(): void {
    this.inflightCount.update((c) => Math.max(0, c - 1));
    if (this.inflightCount() <= 1) {
      this.hide();
    }
  }

  private armSafetyTimeout(): void {
    this.timeoutHandle = setTimeout(() => {
      if (this.isLoading()) {
        this.isLoading.set(false);
      }
    }, this.maxTimeout);
  }
}
