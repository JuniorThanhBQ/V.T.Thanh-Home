import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-comming-soon',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div
      class="relative w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center select-none py-12 px-4"
    >
      <div
        class="p-8 sm:p-12 w-full rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-[#0c121c]/75 border border-slate-200/70 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl"
      >
        <h1
          class="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100"
        >
          {{ title }}
        </h1>

        <p
          class="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-light leading-relaxed max-w-lg mx-auto"
        >
          {{ subtitle }}
        </p>

        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            routerLink="/"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-mono font-semibold hover:opacity-90 transition-opacity shadow-lg cursor-pointer"
          >
            <span>&larr;</span>
            <span>Return to Home</span>
          </a>

          <a
            routerLink="/about"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#172e42]/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-mono font-medium hover:bg-slate-200 dark:hover:bg-[#172e42] transition-colors cursor-pointer"
          >
            <span>Explore About</span>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class CommingSoonComponent {
  @Input() title = 'Coming Soon';
  @Input() subtitle =
    'This section is currently undergoing active engineering and will be deployed shortly.';
}
