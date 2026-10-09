import { Component, OnDestroy, input, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@/shared/services/translation.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
})
export class LoadingComponent implements OnDestroy {
  public isLoading = input<boolean>(true);
  public i18n = inject(TranslationService);

  public progress = signal<number>(1);
  public curtainLifted = signal<boolean>(false);

  private intervalId: ReturnType<typeof setInterval> | undefined;

  constructor() {
    effect(() => {
      if (this.isLoading()) {
        this.runTopUpSequence();
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private runTopUpSequence(): void {
    this.cleanup();
    this.curtainLifted.set(false);
    this.progress.set(1);

    const startTime = performance.now();
    const duration = 520;

    this.intervalId = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(Math.floor((elapsed / duration) * 99) + 1, 100);
      this.progress.set(pct);

      if (pct >= 100) {
        clearInterval(this.intervalId);
        setTimeout(() => {
          this.curtainLifted.set(true);
        }, 120);
      }
    }, 16);
  }

  private cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
