import { Component, OnDestroy, input, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@/shared/services/translation.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-[99999] w-screen h-screen flex flex-col justify-between p-8 sm:p-12 md:p-16 mesh-loader text-slate-900 dark:text-white select-none"
      [class.transition-transform]="curtainLifted()"
      [class.duration-700]="curtainLifted()"
      [class.ease-[cubic-bezier(0.77,0,0.175,1)]]="curtainLifted()"
      [class.-translate-y-full]="curtainLifted()"
      [class.pointer-events-none]="curtainLifted()"
    >
      <div
        class="flex w-full items-center text-xs font-mono tracking-widest text-slate-500 dark:text-slate-400"
      >
        <div class="flex">
          <span class="text-slate-800 dark:text-slate-200 uppercase font-semibold">{{
            i18n.t('loading.subtitle')
          }}</span>
        </div>
        <span class="text-slate-400 dark:text-slate-500 uppercase hidden sm:inline ml-auto">{{
          i18n.t('loading.tech_stack')
        }}</span>
      </div>
      <div class="flex flex-col items-center justify-center my-auto">
        <div class="relative flex items-center justify-center">
          <div class="absolute w-28 h-28 rounded-full bg-sky-500/10 blur-xl animate-pulse"></div>
          <span
            class="relative font-mono text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-[0_0_20px_rgba(56,189,248,0.25)]"
          >
            {{ i18n.t('app.Author') }}
          </span>
        </div>
      </div>
      <div class="flex flex-col space-y-3">
        <div class="flex items-end justify-between font-mono">
          <span
            class="text-xs uppercase tracking-widest text-sky-600 dark:text-sky-400 font-semibold"
          >
            {{ i18n.t('loading.initializing') }}
          </span>
          <span
            class="text-4xl sm:text-5xl font-bold tracking-tighter text-slate-900 dark:text-white tabular-nums"
          >
            {{ progress() }}%
          </span>
        </div>
        <div class="w-full h-[2px] bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-75 ease-out"
            [style.width.%]="progress()"
          ></div>
        </div>
      </div>
    </div>
  `,
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
