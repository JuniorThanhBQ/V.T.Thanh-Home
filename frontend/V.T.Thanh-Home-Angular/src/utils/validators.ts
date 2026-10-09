import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'trashmail.com',
  'sharklasers.com',
  'yopmail.com',
  'dispostable.com',
]);

const STRICT_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

const XSS_PATTERNS = [
  /<\s*\/?\s*script\b[^>]*>/i,
  /<\s*img\b[^>]+onerror\s*=/i,
  /<\s*\/?\s*iframe\b[^>]*>/i,
  /javascript\s*:/i,
  /on\w+\s*=/i,
  /data\s*:\s*text\/html/i,
];

const SQLI_PATTERNS = [
  /(\b(select|insert|update|delete|drop|alter|create|truncate|exec|execute|union)\b.*\b(from|into|table|where|join)\b)/i,
  /('|\b)\s*(or|and)\s+['"\d]+=['"\d]+/i,
  /(--|#|\/\*)/,
  /;\s*(drop|delete|insert|update)/i,
];

export class SecurityValidators {
  static sanitizeInput(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value ? control.value.toString().trim() : '';
      if (!value) return null;

      for (const pattern of XSS_PATTERNS) {
        if (pattern.test(value)) {
          return { securityViolation: 'xss_detected' };
        }
      }

      for (const pattern of SQLI_PATTERNS) {
        if (pattern.test(value)) {
          return { securityViolation: 'sqli_detected' };
        }
      }

      return null;
    };
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
