import { TurnstileService } from '@/shared/services/turnstile.service';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, switchMap, timeout, catchError, throwError, tap, finalize } from 'rxjs';
import { ConnectivityService } from '@/shared/services/connectivity.service';
import { PendingWorkService } from '@/shared/services/pending-work.service';
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
  private connectivity = inject(ConnectivityService);
  private pendingWork = inject(PendingWorkService);

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
      this.connectivity.requireOnline(),
      finalize(() => this.pendingWork.contactSending.set(false)),
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
