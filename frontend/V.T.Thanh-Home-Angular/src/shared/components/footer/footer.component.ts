import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer
      class="border-t border-slate-200 dark:border-slate-800 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md py-3.5 text-xs text-slate-600 dark:text-slate-400 transition-colors duration-300"
    >
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2"
      >
        <div class="animate-stagger-item">
          © {{ currentYear }}
          <span class="font-semibold text-slate-800 dark:text-slate-200">{{
            i18n.t('app.Author')
          }}</span
          >. {{ i18n.t('app.copyright') }}.
        </div>
        <div class="animate-stagger-item flex items-center space-x-3 text-slate-500 dark:text-slate-400">
          <span class="font-mono text-slate-700 dark:text-slate-300">{{
            i18n.t('app.version')
          }}</span>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  public i18n = inject(TranslationService);
  public currentYear = new Date().getFullYear();
}
