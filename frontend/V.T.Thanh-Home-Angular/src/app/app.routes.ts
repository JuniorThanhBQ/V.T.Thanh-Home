import { Routes } from '@angular/router';

export const routes: Routes = [
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
    path: '**',
    redirectTo: '',
  },
];