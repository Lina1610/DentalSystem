import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage) },
      {
        path: 'pacientes',
        loadComponent: () => import('./pages/pacientes/lista-pacientes/lista-pacientes').then((m) => m.ListaPacientesComponent),
      },
      {
        path: 'pacientes/:id',
        loadComponent: () => import('./pages/pacientes/lista-pacientes/lista-pacientes').then((m) => m.ListaPacientesComponent),
      },
      {
        path: 'odontologos',
        loadComponent: () => import('./pages/odontologos/lista-odontologos/lista-odontologos').then((m) => m.ListaOdontologosComponent),
      },
      {
        path: 'citas',
        loadComponent: () => import('./pages/citas/lista-citas/lista-citas').then((m) => m.ListaCitasComponent),
      },
      {
        path: 'agenda',
        loadComponent: () => import('./pages/agendas/lista-agendas/lista-agendas').then((m) => m.ListaAgendasComponent),
      },
      {
        path: 'servicios',
        loadComponent: () => import('./pages/servicios/lista-servicios/lista-servicios').then((m) => m.ListaServiciosComponent),
      },
      // Cualquier subruta desconocida de /admin vuelve al dashboard
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
  // Cualquier otra ruta desconocida: el guard de /admin decide si hace falta login
  {
    path: '**',
    redirectTo: 'admin',
  },
];
