import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteTransitionService } from '@/shared/services/route-transition.service';
import { TranslationService } from '@/shared/services/translation.service';
import { getDynamicLogo } from '@/assets/cloudinaryUrl';

@Component({
  selector: 'app-color-wipe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-wipe.component.html',
  styles: [
    `
      @keyframes smoothFade {
        0% {
          opacity: 0;
          transform: scale(0.98);
        }
        35% {
          opacity: 1;
          transform: scale(1);
        }
        65% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          opacity: 0;
          transform: scale(1.02);
        }
      }

      .animate-smooth-fade {
        animation: smoothFade 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        will-change: opacity, transform;
      }
    `,
  ],
})
export class ColorWipeComponent {
  public transition = inject(RouteTransitionService);
  public i18n = inject(TranslationService);
  public readonly avatarLightUrl = computed(() => getDynamicLogo(this.i18n.currentLang(), 'light'));
  public readonly avatarDarkUrl = computed(() => getDynamicLogo(this.i18n.currentLang(), 'dark'));
}
