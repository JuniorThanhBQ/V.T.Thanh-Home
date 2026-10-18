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
  private animationFrameId: number | undefined;
  constructor() {
    effect(() => {
      if (this.isLoading()) {
        this.runTopUpSequence();
      } else {
        this.finishAndLift();
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
    const duration = 750;
    const step = () => {
      const elapsed = performance.now() - startTime;
      const targetPct = Math.min(Math.floor((elapsed / duration) * 99) + 1, 100);
      const current = this.progress();
      if (current < targetPct) {
        const diff = targetPct - current;
        const increment =
          targetPct >= 100 && diff <= 6 ? diff : Math.max(1, Math.min(diff, Math.ceil(diff / 4)));
        this.progress.set(current + increment);
      }
      if (this.progress() < 100) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.finishAndLift();
      }
    };
    this.animationFrameId = requestAnimationFrame(step);
  }
  private finishAndLift(): void {
    this.cleanup();
    this.progress.set(100);
    setTimeout(() => {
      this.curtainLifted.set(true);
    }, 120);
  }
  private cleanup(): void {
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }
}
