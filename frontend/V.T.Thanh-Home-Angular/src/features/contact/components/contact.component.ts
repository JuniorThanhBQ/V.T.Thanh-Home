import { Component, inject, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslationService } from '@/shared/services/translation.service';
import { BackendHealthService } from '@/shared/services/backend-health.service';
import { AVATAR_URLS } from '@/assets/cloudinaryUrl';
import { AppValidators, SecurityValidators } from '@/utils/validators';
import { ContactApiService } from '../services/contact-api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: '../templates/contact.component.html',
})
export class ContactComponent {
  private cdr = inject(ChangeDetectorRef);
  public submitFailed = false;
  private fb = inject(FormBuilder);
  private contactApi = inject(ContactApiService);
  public i18n = inject(TranslationService);
  public health = inject(BackendHealthService);
  public readonly avatarUrls = AVATAR_URLS;
  public isSubmitted = false;
  public isSubmitting = false;

  public submitButtonText = computed(() => {
    if (this.isSubmitting) {
      return '...';
    }
    return this.i18n.t('contact.form.submit_button');
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
    if (this.contactForm.invalid || this.isSubmitting) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const payload = {
      firstName: SecurityValidators.sanitizeString(this.contactForm.value.firstName),
      lastName: SecurityValidators.sanitizeString(this.contactForm.value.lastName || ''),
      phone: this.contactForm.value.phone || '',
      email: this.contactForm.value.email.trim(),
      service: SecurityValidators.sanitizeString(this.contactForm.value.service || ''),
      message: SecurityValidators.sanitizeString(this.contactForm.value.message),
    };

    this.submitFailed = false;
    this.isSubmitting = true;

    this.contactApi.submitContact(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSubmitted = true;
        this.contactForm.reset();
        this.cdr.markForCheck();
        setTimeout(() => {
          this.isSubmitted = false;
          this.cdr.markForCheck();
        }, 4000);
      },
      error: () => {
        this.isSubmitting = false;
        this.submitFailed = true;
        this.cdr.markForCheck();
      },
    });
  }
}
