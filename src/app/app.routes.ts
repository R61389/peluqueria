import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/advisor', pathMatch: 'full' },
  {
    path: 'advisor',
    loadComponent: () =>
      import('./features/image-advisor/image-advisor.component').then(
        (m) => m.ImageAdvisorComponent
      ),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history.component').then((m) => m.HistoryComponent),
  },
  { path: '**', redirectTo: '/advisor' },
];
