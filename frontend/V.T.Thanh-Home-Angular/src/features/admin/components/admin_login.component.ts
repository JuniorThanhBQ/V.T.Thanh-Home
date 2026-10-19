import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SecurityValidators } from '@/utils/validators';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: '../templates/admin_login.component.html',
})
export class AdminLoginComponent {
  private fb = inject(FormBuilder);
  public adminService = inject(AdminService);

  public readonly loginError = signal<string | null>(null);
  public readonly isLoggingIn = signal<boolean>(false);

  public loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, SecurityValidators.sanitizeInput()]],
    password: ['', [Validators.required, SecurityValidators.sanitizeInput()]],
  });

  public isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  public onLogin(): void {
    this.loginError.set(null);
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      if (
        this.loginForm.get('username')?.errors?.['securityViolation'] ||
        this.loginForm.get('password')?.errors?.['securityViolation']
      ) {
        this.loginError.set('Security violation: HTML or script injection detected.');
      }
      return;
    }

    this.isLoggingIn.set(true);
    const { username, password } = this.loginForm.value;
    const sanitizedUsername = SecurityValidators.sanitizeString(username);

    setTimeout(() => {
      const ok = this.adminService.login(sanitizedUsername, password);
      if (!ok) {
        this.loginError.set(
          'Invalid credentials. If you ended up here by mistake, please go back to the homepage.',
        );
      } else {
        this.loginForm.reset();
      }
      this.isLoggingIn.set(false);
    }, 400);
  }
}
