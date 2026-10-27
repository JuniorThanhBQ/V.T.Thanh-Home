import { TurnstileService } from '@/shared/services/turnstile.service';
import { finalize, switchMap, timeout, of } from 'rxjs';
import { VisitorService } from '@/shared/services/visitor.service';
import { TranslationService } from '@/shared/services/translation.service';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { API_ENDPOINTS, buildApiUrl } from '@/configs/apis';
import { BackendHealthService } from '@/shared/services/backend-health.service';
import { ConnectivityService } from '@/shared/services/connectivity.service';
import { PendingWorkService } from '@/shared/services/pending-work.service';

export interface ChatMessageUI {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export interface ChatMessageResponse {
  messageId: number;
  reply: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ChatComponentService {
  private http = inject(HttpClient);
  private turnstile = inject(TurnstileService);
  private conversationReady = false;
  private visitor = inject(VisitorService);
  private i18n = inject(TranslationService);
  private health = inject(BackendHealthService);
  private connectivity = inject(ConnectivityService);
  private pendingWork = inject(PendingWorkService);
  private pendingRequest?: { text: string; id: string };
  public readonly failedMessage = signal<string | null>(null);

  public readonly messages = signal<ChatMessageUI[]>([]);
  public readonly isSending = this.pendingWork.chatSending;
  public sendMessage(userText: string): void {
    const trimmed = userText.trim();
    if (!this.health.available() || !trimmed || trimmed.length > 1000 || this.isSending()) {
      return;
    }

    const now = new Date();
    if (this.pendingRequest?.text !== trimmed)
      this.pendingRequest = { text: trimmed, id: crypto.randomUUID() };
    const requestId = this.pendingRequest.id;
    this.failedMessage.set(null);
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessageUI = {
      id: `u-${requestId}`,
      sender: 'user',
      text: trimmed,
      time: timeString,
    };

    this.messages.update((list) =>
      list.some((message) => message.id === userMsg.id) ? list : [...list, userMsg],
    );
    this.isSending.set(true);

    const payload = {
      message: trimmed,
      requestId,
    };

    const url = buildApiUrl(API_ENDPOINTS.chat.message);

    this.visitor
      .ensureRegistered()
      .pipe(
        switchMap(() => (this.conversationReady ? of(undefined) : this.turnstile.verify('chat'))),
        switchMap((turnstileToken) =>
          this.http
            .post<ChatMessageResponse>(url, { ...payload, turnstileToken })
            .pipe(timeout(65000)),
        ),
        this.connectivity.requireOnline(),
        finalize(() => this.isSending.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.pendingRequest = undefined;
          this.conversationReady = true;
          const botMsg: ChatMessageUI = {
            id: `b-${res.messageId || Date.now()}`,
            sender: 'bot',
            text: res.reply,
            time: new Date(res.timestamp || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };

          this.messages.update((list) => [...list, botMsg]);
          this.isSending.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.failedMessage.set(trimmed);
          if (error.status === 401) {
            this.visitor.invalidate();
            this.conversationReady = false;
          }
          const errorMsg: ChatMessageUI = {
            id: `err-${Date.now()}`,
            sender: 'bot',
            text: this.i18n.t(error.status === 429 ? 'chat.rate_limited' : 'chat.connection_error'),
            time: timeString,
          };
          this.messages.update((list) => [...list, errorMsg]);
          this.isSending.set(false);
        },
      });
  }
}
