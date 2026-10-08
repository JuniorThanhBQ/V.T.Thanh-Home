import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '@/shared/services/translation.service';
import { AVATAR_URLS } from '@/assets/cloudinaryUrl';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full min-h-[calc(100vh-4.5rem)] flex items-center justify-center transition-colors duration-500 select-none">
      <div class="relative w-full min-h-[100vh] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center px-6 py-20 border border-slate-200/80 dark:border-slate-800/80">
        <img
          [src]="avatarUrls.contact_page_background"
          alt="Contact Page Backdrop"
          class="absolute inset-0 w-full h-full object-cover object-top pointer-events-none z-0"
        />

        <div class="absolute inset-0 bg-slate-950/60 dark:bg-[#070e17]/75 pointer-events-none z-0"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/70 pointer-events-none z-0"></div>

        <div class="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
          <span class="text-xs uppercase tracking-[0.35em] font-mono text-sky-400 mb-6 block">
            Get in Touch
          </span>

          <h1 class="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight text-white leading-[1.3] sm:leading-[1.2] max-w-3xl">
            Van Trung Thanh is a Software & GenAI Engineer building enterprise distributed systems and reactive web architectures.
          </h1>

          <div class="mt-10 sm:mt-12 inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 rounded-full bg-white/10 dark:bg-white/[0.08] border border-white/20 backdrop-blur-2xl shadow-2xl">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] sm:text-xs font-mono font-medium tracking-wider uppercase text-slate-200">
              <svg class="w-3.5 h-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>HCMC</span>
            </div>

            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] sm:text-xs font-mono font-medium tracking-wider uppercase text-slate-200">
              <svg class="w-3.5 h-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              <span>HCMCOU</span>
            </div>

            <span class="hidden sm:inline-block w-px h-4 bg-white/30"></span>

            <button
              (click)="copyEmail()"
              class="group inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white/90 hover:text-white transition-colors"
              title="Click to copy email address"
            >
              <span class="font-mono">{{ emailAddress }}</span>
              <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/30 text-sky-300 border border-sky-400/30">
                {{ copied ? 'Copied!' : 'Copy' }}
              </span>
            </button>
          </div>

          <div class="flex items-center gap-6 mt-8">
            <a
              href="https://github.com/JuniorThanhBQ"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs font-mono tracking-wider text-slate-400 hover:text-sky-400 transition-colors uppercase"
            >
              GitHub
            </a>
            <span class="text-slate-600">/</span>
            <a
              href="https://www.linkedin.com/in/juniorthanh09/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs font-mono tracking-wider text-slate-400 hover:text-sky-400 transition-colors uppercase"
            >
              LinkedIn
            </a>
            <span class="text-slate-600">/</span>
            <a
              href="mailto:thanh.vantrung2005@gmail.com"
              class="text-xs font-mono tracking-wider text-slate-400 hover:text-sky-400 transition-colors uppercase"
            >
              Direct Mail
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ContactComponent {
  public i18n = inject(TranslationService);
  public readonly avatarUrls = AVATAR_URLS;
  public readonly emailAddress = 'thanh.vantrung2005@gmail.com';
  public copied = false;

  public copyEmail(): void {
    navigator.clipboard.writeText(this.emailAddress);
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 2000);
  }
}