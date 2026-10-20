import { TurnstileService } from '@/shared/services/turnstile.service';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, switchMap, timeout, catchError, throwError, tap } from 'rxjs';
import { VisitorService } from '@/shared/services/visitor.service';
import { API_ENDPOINTS, buildApiUrl } from '@/configs/apis';

export interface ContactPayload {
  firstName: string;
  lastName?: string;
  phone?: string;
  email: string;
  service?: string;
  message: string;
  turnstileToken?: string;
}

export interface ContactReceiptResponse {
  id: number;
  status: string;
  message: string;
  submittedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ContactApiService {
  private pending?: { signature: string; key: string };
  private http = inject(HttpClient);
  private turnstile = inject(TurnstileService);
  private visitor = inject(VisitorService);

  public submitContact(payload: ContactPayload): Observable<ContactReceiptResponse> {
    const signature = JSON.stringify(payload);
    if (this.pending?.signature !== signature)
      this.pending = { signature, key: crypto.randomUUID() };
    const idempotencyKey = this.pending.key;
    const url = buildApiUrl(API_ENDPOINTS.contacts);
    return this.visitor.ensureRegistered().pipe(
      switchMap(() => this.turnstile.verify('contact')),
      switchMap((turnstileToken) =>
        this.http
          .post<ContactReceiptResponse>(url, { ...payload, turnstileToken, idempotencyKey })
          .pipe(timeout(65000)),
      ),
      tap(() => {
        this.pending = undefined;
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) this.visitor.invalidate();
        return throwError(() => error);
      }),
    );
  }
}
