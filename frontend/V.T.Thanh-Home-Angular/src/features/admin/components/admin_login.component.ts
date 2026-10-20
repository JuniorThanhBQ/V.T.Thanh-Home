import { Component, DestroyRef, HostListener, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: '../templates/admin_login.component.html',
})
export class AdminLoginComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly destroyRef = inject(DestroyRef);
  public readonly adminService = inject(AdminService);
  public readonly loginError = signal('');
  public readonly isLoggingIn = signal(false);
  public readonly loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.maxLength(512)]],
  });
  public isFieldInvalid(field: 'username' | 'password'): boolean {
    const control = this.loginForm.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
  public onLogin(): void {
    if (this.isLoggingIn()) return;
    this.loginError.set('');
    if (this.loginForm.invalid || !this.loginForm.controls.username.value.trim()) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const credentials = this.loginForm.getRawValue();
    credentials.username = credentials.username.trim();
    this.loginForm.reset();
    this.loginForm.disable();
    this.isLoggingIn.set(true);
    this.adminService
      .login(credentials)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          credentials.username = '';
          credentials.password = '';
          this.loginForm.reset();
          this.loginForm.enable();
          this.isLoggingIn.set(false);
        }),
      )
      .subscribe({
        next: (authenticated) => {
          if (!authenticated) this.loginError.set('Sign-in was not confirmed by the server.');
        },
        error: (error: unknown) =>
          this.loginError.set(
            error instanceof HttpErrorResponse && error.status === 401
              ? 'Invalid credentials.'
              : this.adminService.errorMessage(error),
          ),
      });
  }
  @HostListener('window:pagehide')
  public clearCredentials(): void {
    this.loginForm.reset();
  }
  public ngOnDestroy(): void {
    this.clearCredentials();
  }
}
