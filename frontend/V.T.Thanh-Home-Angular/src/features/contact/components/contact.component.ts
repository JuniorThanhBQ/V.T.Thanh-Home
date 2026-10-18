import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslationService } from '@/shared/services/translation.service';
import { BackendHealthService } from '@/shared/services/backend-health.service';
import { AVATAR_URLS } from '@/assets/cloudinaryUrl';
import { AppValidators, SecurityValidators } from '@/utils/validators';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: '../templates/contact.component.html',
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  public i18n = inject(TranslationService);
  public health = inject(BackendHealthService);
  public readonly avatarUrls = AVATAR_URLS;
  public isSubmitted = false;

  public submitButtonText = computed(() => {
    const status = this.health.status();
    if (status === 'UP') {
      return this.i18n.t('contact.form.submit_button');
    }
    if (status === 'DOWN') {
      return this.i18n.t('app.backend_health_down');
    }
    return this.i18n.t('app.backend_health_standby');
  });

  public contactForm: FormGroup = this.fb.group({
    firstName: [
      '',
      [Validators.required, AppValidators.textLength(2, 100), SecurityValidators.sanitizeInput()],
    ],
    lastName: ['', [AppValidators.textLength(1, 50), SecurityValidators.sanitizeInput()]],
    phone: ['', [AppValidators.phoneNumber()]],
    email: ['', [Validators.required, AppValidators.strictEmail()]],
    service: ['', [AppValidators.textLength(2, 100), SecurityValidators.sanitizeInput()]],
    message: [
      '',
      [Validators.required, AppValidators.textLength(10, 1000), SecurityValidators.sanitizeInput()],
    ],
  });

  public isFieldInvalid(field: string): boolean {
    const control = this.contactForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched || this.isSubmitted));
  }

  public onSubmit(): void {
    if (this.health.status() !== 'UP' || this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.contactForm.patchValue({
      firstName: SecurityValidators.sanitizeString(this.contactForm.value.firstName),
      lastName: SecurityValidators.sanitizeString(this.contactForm.value.lastName),
      service: SecurityValidators.sanitizeString(this.contactForm.value.service),
      message: SecurityValidators.sanitizeString(this.contactForm.value.message),
    });

    this.isSubmitted = true;
    setTimeout(() => {
      this.isSubmitted = false;
      this.contactForm.reset();
    }, 4000);
  }
}
