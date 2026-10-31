import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import vi from '../../public/i18n/vi.json';
import en from '../../public/i18n/en.json';
import de from '../../public/i18n/de.json';
import fr from '../../public/i18n/fr.json';
import ja from '../../public/i18n/ja.json';
import zh from '../../public/i18n/zh.json';
import es from '../../public/i18n/es.json';
import ru from '../../public/i18n/ru.json';
import kr from '../../public/i18n/kr.json';

const dictionaries: Record<string, unknown> = { vi, en, de, fr, ja, zh, es, ru, kr };

export const serverHttpInterceptor: HttpInterceptorFn = (request, next) => {
  const language = /^\/i18n\/([a-z]+)\.json$/.exec(request.url)?.[1];
  if (request.method === 'GET' && language && dictionaries[language]) {
    return of(new HttpResponse({ body: dictionaries[language], url: request.url }));
  }
  if (/^\/(?:api|actuator)(?:\/|$)/.test(request.url)) {
    const origin =
      process.env['SSR_BACKEND_ORIGIN'] || 'https://vtthanh-backend-latest.onrender.com';
    return next(request.clone({ url: new URL(request.url, origin).href }));
  }
  return next(request);
};
