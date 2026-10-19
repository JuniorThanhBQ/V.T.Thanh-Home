import { Routes, Route, UrlSegment } from '@angular/router';

const coreRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('@/features/home/components/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('@/features/about/components/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('@/features/project/components/project.component').then((m) => m.ProjectComponent),
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('@/features/blog/components/blog.component').then((m) => m.BlogComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('@/features/contact/components/contact.component').then((m) => m.ContactComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('@/features/admin/components/admin.component').then((m) => m.AdminComponent),
  },
];

const SUPPORTED_PREFIX_LANGS = new Set(['en', 'de', 'fr', 'ja', 'zh', 'es', 'ru', 'kr']);

export const routes: Routes = [
  {
    matcher: (segments: UrlSegment[]) => {
      if (segments.length > 0 && SUPPORTED_PREFIX_LANGS.has(segments[0].path)) {
        return {
          consumed: [segments[0]],
          posParams: { lang: segments[0] },
        };
      }
      return null;
    },
    children: coreRoutes,
  },
  ...coreRoutes,
  {
    path: '**',
    redirectTo: '',
  },
];
