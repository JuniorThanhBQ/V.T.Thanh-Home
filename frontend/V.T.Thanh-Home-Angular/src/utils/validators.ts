import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'mailinator.net',
  'mailinator.org',
  'mailinator.info',
  'mailinator.us',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '10minutemail.de',
  '10minuteemail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'tempmail.com',
  'tempmail.net',
  'tempmail.org',
  'tempmail.io',
  'tempmail.co',
  'tempmail.ai',
  'tempmail.plus',
  'tempmail.cc',
  'tempmail.dev',
  'tempmail.space',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'yopmail.org',
  'yopmail.info',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'trashmail.de',
  'trashmail.fr',
  'sharklasers.com',
  'dispostable.com',
  'maildrop.cc',
  'tempr.email',
  'mailnesia.com',
  'getnada.com',
  'tempinbox.com',
  'duckzmail.com',
  'throwawaymail.app',
  'inbox.testmail.app',
]);

const STRICT_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

export class SecurityValidators {
  private static readonly HTML_TAG_REGEX = /<[^>]+>/;
  private static readonly DANGEROUS_ATTRIBUTES =
    /(on\w+\s*=|javascript\s*:|data\s*:\s*text\/html|vbscript\s*:|&#)/i;

  static noHtml(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value ? control.value.toString().trim() : '';
      if (!value) return null;

      if (
        SecurityValidators.HTML_TAG_REGEX.test(value) ||
        SecurityValidators.DANGEROUS_ATTRIBUTES.test(value)
      ) {
        return { securityViolation: 'html_not_allowed' };
      }

      return null;
    };
  }

  static sanitizeInput(): ValidatorFn {
    return SecurityValidators.noHtml();
  }

  static sanitizeString(input: string): string {
    if (!input) return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#27;');
  }
}

export class AppValidators {
  static strictEmail(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value ? control.value.trim() : '';
      if (!value) return null;

      if (!STRICT_EMAIL_REGEX.test(value)) {
        return { invalidEmailFormat: true };
      }

      const domain = value.split('@')[1]?.toLowerCase();
      if (domain) {
        const parts = domain.split('.');
        if (parts.length < 2 || parts[parts.length - 1].length < 2) {
          return { invalidTld: true };
        }

        if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
          return { disposableEmail: true };
        }
      }

      return null;
    };
  }

  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value ? control.value.trim() : '';
      if (!value) return null;

      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15 || !PHONE_REGEX.test(value)) {
        return { invalidPhone: true };
      }

      return null;
    };
  }

  static textLength(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value ? control.value.trim() : '';
      if (!value) return null;

      if (value.length < min) {
        return { minLengthRequired: { required: min, actual: value.length } };
      }
      if (value.length > max) {
        return { maxLengthAllowed: { allowed: max, actual: value.length } };
      }

      return null;
    };
  }
}
