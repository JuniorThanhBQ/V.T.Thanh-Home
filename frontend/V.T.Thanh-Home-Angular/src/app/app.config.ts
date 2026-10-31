import { isPlatformBrowser } from '@angular/common';
import {
  ApplicationConfig,
  ErrorHandler,
  PLATFORM_ID,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { Router, provideRouter, withViewTransitions, withInMemoryScrolling } from '@angular/router';
import * as Sentry from '@sentry/angular';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { loadingInterceptor } from '@/shared/interceptors/loading.interceptor';
import { connectivityInterceptor } from '@/shared/interceptors/connectivity.interceptor';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerImmediately',
      updateViaCache: 'none',
    }),
    { provide: ErrorHandler, useValue: Sentry.createErrorHandler() },
    { provide: Sentry.TraceService, deps: [Router] },
    provideAppInitializer(() => {
      if (isPlatformBrowser(inject(PLATFORM_ID))) inject(Sentry.TraceService);
    }),
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(withInterceptors([connectivityInterceptor, loadingInterceptor])),
    provideClientHydration(),
  ],
};
