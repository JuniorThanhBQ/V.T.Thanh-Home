import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { inject as injectAnalytics } from '@vercel/analytics';
import { appConfig } from './app/app.config';
import { App } from './app/app';

declare const process: { env: { SENTRY_DSN: string } };

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: isDevMode() ? 'development' : 'production',
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
  tracePropagationTargets: [/^\/api\/v1(?:\/|$)/, /^\/actuator(?:\/|$)/],
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
  },
});

injectAnalytics();
injectSpeedInsights();
bootstrapApplication(App, appConfig).catch((err) => {
  Sentry.captureException(err);
  console.error(err);
});
