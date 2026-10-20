import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
    username: ['', [Validators.required, Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.maxLength(512)]],
  });

  public isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  public onLogin(): void {
    this.loginError.set(null);
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoggingIn.set(true);
    const { username, password } = this.loginForm.value;
    const sanitizedUsername = username.trim();

    this.adminService.login(sanitizedUsername, password).subscribe({
      next: (ok) => {
        if (!ok) {
          this.loginError.set(
            'Invalid credentials. If you ended up here by mistake, please go back to the homepage.',
          );
        } else {
          this.loginForm.reset();
        }
        this.isLoggingIn.set(false);
      },
      error: () => {
        this.loginError.set(
          'Invalid credentials. If you ended up here by mistake, please go back to the homepage.',
        );
        this.isLoggingIn.set(false);
      },
    });
  }
}
