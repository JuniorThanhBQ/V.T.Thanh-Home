import { bootstrapApplication } from '@angular/platform-browser';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { inject as injectAnalytics } from '@vercel/analytics';
import { appConfig } from './app/app.config';
import { App } from './app/app';

injectAnalytics();
injectSpeedInsights();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
