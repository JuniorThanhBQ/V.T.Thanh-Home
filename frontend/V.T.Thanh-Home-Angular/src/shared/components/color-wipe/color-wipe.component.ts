import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteTransitionService } from '@/shared/services/route-transition.service';
import { AVATAR_URLS } from '@/assets/cloudinaryUrl';

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
  readonly avatarLightUrl = AVATAR_URLS.light;
  readonly avatarDarkUrl = AVATAR_URLS.dark;
}
