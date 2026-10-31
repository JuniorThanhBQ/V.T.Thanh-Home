import { DestroyRef, inject } from '@angular/core';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { MARKDOWN_PURIFIER } from '@/shared/pipes/markdown.pipe';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { serverHttpInterceptor } from './server-http.interceptor';
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    {
      provide: MARKDOWN_PURIFIER,
      useFactory: () => {
        const dom = new JSDOM('');
        inject(DestroyRef).onDestroy(() => dom.window.close());
        return createDOMPurify(dom.window);
      },
    },
    provideServerRendering(withRoutes(serverRoutes)),
    provideHttpClient(withInterceptors([serverHttpInterceptor])),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
