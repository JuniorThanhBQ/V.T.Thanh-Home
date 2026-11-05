import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { inject as injectAnalytics } from '@vercel/analytics';
import { appConfig } from './app/app.config';
import { App } from './app/app';

declare const process: {
  env: { SENTRY_DSN: string; VERCEL_OBSERVABILITY_CLIENT_CONFIG: string };
};

function initializeTelemetry(initialize: () => void): void {
  try {
    initialize();
  } catch (error) {
    console.warn('Telemetry unavailable', error);
  }
}

initializeTelemetry(() =>
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    transport: (options) => {
      const transport = Sentry.makeFetchTransport(options);
      let remainingAttempts = 3;

      return {
        flush: transport.flush,
        async send(envelope) {
          if (remainingAttempts === 0) return {};

          remainingAttempts--;
          try {
            const response = await transport.send(envelope);
            const status = response.statusCode;
            if (status === undefined || (status >= 200 && status < 300)) {
              remainingAttempts++;
            }
            return response;
          } catch {
            return {};
          }
        },
      };
    },
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
  }),
);

if (!['localhost', '127.0.0.1'].includes(location.hostname)) {
  initializeTelemetry(() => injectAnalytics({}, process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG));
  initializeTelemetry(() =>
    injectSpeedInsights({}, process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG),
  );
}
bootstrapApplication(App, appConfig).catch((err) => {
  console.error(err);
  initializeTelemetry(() => Sentry.captureException(err));
});
