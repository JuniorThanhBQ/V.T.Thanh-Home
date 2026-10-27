import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, timeout } from 'rxjs';
import { ConnectivityService } from './connectivity.service';

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  execute(id: string): void;
  remove(id: string): void;
}

@Injectable({ providedIn: 'root' })
export class TurnstileService {
  private http = inject(HttpClient);
  private connectivity = inject(ConnectivityService);
  private script?: Promise<TurnstileApi>;

  public verify(action: 'contact' | 'chat'): Observable<string | undefined> {
    return this.http.get<{ turnstileSiteKey: string }>('/api/v1/security/config').pipe(
      timeout(60000),
      switchMap((config) =>
        config.turnstileSiteKey
          ? new Observable<string>((subscriber) => {
              const controller = new AbortController();
              this.challenge(config.turnstileSiteKey, action, controller.signal)
                .then((token) => {
                  subscriber.next(token);
                  subscriber.complete();
                })
                .catch((error: unknown) => subscriber.error(error));
              return () => controller.abort();
            })
          : of(undefined),
      ),
      this.connectivity.requireOnline(),
    );
  }

  private load(): Promise<TurnstileApi> {
    const scope = window as Window & { turnstile?: TurnstileApi };
    if (scope.turnstile) return Promise.resolve(scope.turnstile);
    if (!this.script) {
      this.script = new Promise<TurnstileApi>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        const timer = setTimeout(() => {
          script.remove();
          reject(new Error('Security verification unavailable'));
        }, 10000);
        script.onload = () => {
          clearTimeout(timer);
          if (scope.turnstile) resolve(scope.turnstile);
          else reject(new Error('Security verification unavailable'));
        };
        script.onerror = () => {
          clearTimeout(timer);
          script.remove();
          reject(new Error('Security verification unavailable'));
        };
        document.head.appendChild(script);
      }).catch((error: unknown) => {
        this.script = undefined;
        throw error;
      });
    }
    return this.script;
  }

  private async challenge(siteKey: string, action: string, signal: AbortSignal): Promise<string> {
    const api = await this.load();
    if (signal.aborted || !this.connectivity.online())
      throw new Error('Security verification cancelled');
    return new Promise<string>((resolve, reject) => {
      const container = document.createElement('div');
      container.className = 'fixed bottom-4 left-4 z-[10000]';
      document.body.appendChild(container);
      let id: string | undefined;
      let finished = false;
      const finish = (token?: string): void => {
        if (finished) return;
        finished = true;
        signal.removeEventListener('abort', cancel);
        clearTimeout(timer);
        if (id) api.remove(id);
        container.remove();
        if (token) resolve(token);
        else reject(new Error('Security verification failed. Please retry.'));
      };
      const cancel = () => finish();
      const timer = setTimeout(() => finish(), 120000);
      signal.addEventListener('abort', cancel, { once: true });
      try {
        id = api.render(container, {
          sitekey: siteKey,
          action,
          execution: 'execute',
          appearance: 'interaction-only',
          callback: (token: string) => finish(token),
          'error-callback': () => finish(),
          'expired-callback': () => finish(),
        });
        if (finished) api.remove(id);
        else api.execute(id);
      } catch {
        finish();
      }
    });
  }
}
