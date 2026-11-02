import { TurnstileService } from '@/shared/services/turnstile.service';
import {
  auditTime,
  finalize,
  switchMap,
  timeout,
  of,
  Subscription,
  timer,
  takeUntil,
  mergeMap,
  throwError,
} from 'rxjs';
import { ChatStreamParser } from './chat-stream';
import { VisitorService } from '@/shared/services/visitor.service';
import { TranslationService } from '@/shared/services/translation.service';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { API_ENDPOINTS, buildApiUrl } from '@/configs/apis';
import { BackendHealthService } from '@/shared/services/backend-health.service';
import { ConnectivityService } from '@/shared/services/connectivity.service';
import { PendingWorkService } from '@/shared/services/pending-work.service';

export interface ChatMessageUI {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  state?: 'streaming' | 'completed' | 'interrupted';
}

interface ChatMessageResponse {
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
  private active?: Subscription;
  private pendingRequest?: { text: string; id: string };
  public readonly failedMessage = signal<string | null>(null);
  public readonly statusKey = signal<string | null>(null);

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
    this.statusKey.set('chat.progress_connecting');

    const payload = {
      message: trimmed,
      requestId,
    };

    const url = buildApiUrl(API_ENDPOINTS.chat.stream);

    const parser = new ChatStreamParser();
    const botId = `b-${requestId}`;
    let completed = false;
    let reply = '';
    const update = (text: string, state: ChatMessageUI['state'] = 'streaming') => {
      reply = text;
      this.messages.update((list) => {
        const message: ChatMessageUI = { id: botId, sender: 'bot', text, time: timeString, state };
        return list.some((item) => item.id === botId)
          ? list.map((item) => (item.id === botId ? message : item))
          : [...list, message];
      });
    };
    const fail = (error: unknown) => {
      this.failedMessage.set(trimmed);
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      if (status === 401) {
        this.visitor.invalidate();
        this.conversationReady = false;
      }
      update(
        `${reply}${reply ? '\n\n' : ''}${this.i18n.t(status === 429 ? 'chat.rate_limited' : 'chat.connection_error')}`,
        'interrupted',
      );
    };
    this.active = this.visitor
      .ensureRegistered()
      .pipe(
        switchMap(() => (this.conversationReady ? of(undefined) : this.turnstile.verify('chat'))),
        switchMap((turnstileToken) =>
          this.http
            .post(
              url,
              { ...payload, turnstileToken },
              {
                responseType: 'text',
                observe: 'events',
                reportDownloadProgress: true,
              },
            )
            .pipe(
              timeout({ each: 20000 }),
              auditTime(40),
              takeUntil(
                timer(60000).pipe(
                  mergeMap(() => throwError(() => new Error('Chat deadline exceeded'))),
                ),
              ),
            ),
        ),
        this.connectivity.requireOnline(),
        finalize(() => {
          this.isSending.set(false);
          this.statusKey.set(null);
        }),
      )
      .subscribe({
        next: (event) => {
          try {
            const text =
              event.type === HttpEventType.DownloadProgress
                ? event.partialText
                : event.type === HttpEventType.Response
                  ? event.body
                  : undefined;
            if (text === undefined || text === null) return;
            for (const frame of parser.read(text)) {
              const data = frame.data as Record<string, unknown>;
              if (frame.event === 'start') this.conversationReady = true;
              if (frame.event === 'status' && !reply) {
                const stage = data['stage'];
                if (stage === 'preparing' || stage === 'generating')
                  this.statusKey.set(`chat.progress_${stage}`);
              }
              if (frame.event === 'delta') {
                if (typeof data['text'] !== 'string') throw new Error('Invalid delta');
                if (data['text']) this.statusKey.set(null);
                update(reply + data['text']);
              }
              if (frame.event === 'done') {
                const result = frame.data as ChatMessageResponse;
                if (typeof result.reply !== 'string' || !result.messageId)
                  throw new Error('Invalid completion');
                update(result.reply, 'completed');
                completed = true;
                this.pendingRequest = undefined;
              }
              if (frame.event === 'error')
                throw new HttpErrorResponse({ status: Number(data['status']) || 503 });
            }
          } catch (error) {
            fail(error);
            this.active?.unsubscribe();
          }
        },
        error: fail,
        complete: () => {
          if (!completed) fail(new Error('Chat stream interrupted'));
        },
      });
  }

  public cancel(): void {
    if (!this.isSending()) return;
    this.active?.unsubscribe();
    this.messages.update((list) =>
      list.map((message) =>
        message.state === 'streaming'
          ? {
              ...message,
              state: 'interrupted',
              text: `${message.text}\n\n${this.i18n.t('chat.connection_error')}`,
            }
          : message,
      ),
    );
    this.failedMessage.set(this.pendingRequest?.text ?? null);
  }
}
