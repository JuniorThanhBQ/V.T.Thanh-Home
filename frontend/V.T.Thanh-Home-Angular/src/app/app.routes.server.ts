import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'admin', renderMode: RenderMode.Client },
  ...['en', 'de', 'fr', 'ja', 'zh', 'es', 'ru', 'kr'].map((lang): ServerRoute => ({
    path: `${lang}/admin`,
    renderMode: RenderMode.Client,
  })),
  { path: '**', renderMode: RenderMode.Server },
];
