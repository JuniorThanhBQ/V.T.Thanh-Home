import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, switchMap, timeout } from 'rxjs';

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  execute(id: string): void;
  remove(id: string): void;
}

@Injectable({ providedIn: 'root' })
export class TurnstileService {
  private http = inject(HttpClient);
  private script?: Promise<TurnstileApi>;

  public verify(action: 'contact' | 'chat'): Observable<string | undefined> {
    return this.http.get<{ turnstileSiteKey: string }>('/api/v1/security/config').pipe(
      timeout(60000),
      switchMap((config) =>
        config.turnstileSiteKey
          ? from(this.challenge(config.turnstileSiteKey, action))
          : of(undefined),
      ),
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

  private async challenge(siteKey: string, action: string): Promise<string> {
    const api = await this.load();
    return new Promise<string>((resolve, reject) => {
      const container = document.createElement('div');
      container.className = 'fixed bottom-4 left-4 z-[10000]';
      document.body.appendChild(container);
      let id: string | undefined;
      const finish = (token?: string): void => {
        clearTimeout(timer);
        if (id) api.remove(id);
        container.remove();
        if (token) resolve(token);
        else reject(new Error('Security verification failed. Please retry.'));
      };
      const timer = setTimeout(() => finish(), 120000);
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
        api.execute(id);
      } catch {
        finish();
      }
    });
  }
}
