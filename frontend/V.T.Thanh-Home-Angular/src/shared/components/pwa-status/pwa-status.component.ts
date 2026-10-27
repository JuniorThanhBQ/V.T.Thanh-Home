import { Component, inject } from '@angular/core';
import { BackendHealthService } from '@/shared/services/backend-health.service';
import { PwaLifecycleService } from '@/shared/services/pwa-lifecycle.service';
import { TranslationService } from '@/shared/services/translation.service';

@Component({
  selector: 'app-pwa-status',
  standalone: true,
  templateUrl: './pwa-status.component.html',
})
export class PwaStatusComponent {
  public readonly health = inject(BackendHealthService);
  public readonly pwa = inject(PwaLifecycleService);
  public readonly i18n = inject(TranslationService);
}
