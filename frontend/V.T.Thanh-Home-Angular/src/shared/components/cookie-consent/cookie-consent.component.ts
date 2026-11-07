import { Component, inject, computed } from '@angular/core';
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
  private readonly i18n = inject(TranslationService);

  public readonly titleText = computed(() => {
    const key = 'privacy.cookie_title';
    const translated = this.i18n.t(key);
    return translated !== key ? translated : 'Privacy and Cookie Settings';
  });

  public readonly descriptionText = computed(() => {
    const key = 'privacy.cookie_desc';
    const translated = this.i18n.t(key);
    return translated !== key
      ? translated
      : 'We use strictly necessary cookies for session security and anti-bot verification. With your consent, the website can enable privacy-friendly performance telemetry to improve our site.';
  });

  public readonly acceptText = computed(() => {
    const key = 'privacy.accept_all';
    const translated = this.i18n.t(key);
    return translated !== key ? translated : 'Accept All';
  });

  public readonly declineText = computed(() => {
    const key = 'privacy.essential_only';
    const translated = this.i18n.t(key);
    return translated !== key ? translated : 'Essential Only';
  });
}
