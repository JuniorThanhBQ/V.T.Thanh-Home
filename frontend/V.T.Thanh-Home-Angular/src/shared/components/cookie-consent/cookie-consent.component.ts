import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsentService } from '@/shared/services/consent.service';
import { TranslationService } from '@/shared/services/translation.service';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookie-consent.component.html',
})
export class CookieConsentComponent {
  public readonly consent = inject(ConsentService);
  public readonly i18n = inject(TranslationService);
}
