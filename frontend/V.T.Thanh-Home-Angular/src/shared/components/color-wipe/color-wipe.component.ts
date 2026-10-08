import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteTransitionService } from '@/shared/services/route-transition.service';
import { AVATAR_URLS } from '@/assets/cloudinaryUrl';

@Component({
  selector: 'app-color-wipe',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (transition.isWiping()) {
      <div class="fixed inset-0 z-[99998] pointer-events-none overflow-hidden">
        <div
          class="absolute inset-0 z-40 bg-[#e7f3ff]/90 dark:bg-[#172f43]/90 backdrop-blur-xs flex items-center justify-center pointer-events-none animate-smooth-fade"
        >
          <div class="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
            <div
              class="absolute -inset-3 rounded-full blur-xl opacity-80 animate-pulse bg-sky-300/70 dark:bg-[#295770]/80"
            ></div>
            <div
              class="relative w-full h-full rounded-full p-1.5 backdrop-blur-md bg-white/60 dark:bg-[#080f17]/80 ring-2 ring-sky-100 dark:ring-[#295770] shadow-[0_0_15px_rgba(41,87,112,0.5)] dark:shadow-[0_0_35px_rgba(41,87,112,0.8)]"
            >
              <img
                [src]="avatarLightUrl"
                alt="V.T.Thanh Brand Emblem (Light)"
                class="w-full h-full object-cover rounded-full border-2 border-white/80 block dark:hidden"
              />
              <img
                [src]="avatarDarkUrl"
                alt="V.T.Thanh Brand Emblem (Dark)"
                class="w-full h-full object-cover rounded-full border-2 border-white/80 dark:border-[#172e42] opacity-90 hidden dark:block"
              />
            </div>
          </div>
        </div>
      </div>
    }
  `,
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
