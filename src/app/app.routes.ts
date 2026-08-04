import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { pacienteDetalleResolver, pacientesResolver } from './core/resolvers/pacientes.resolver';
import { odontologosResolver } from './core/resolvers/odontologos.resolver';

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
    path: 'register',
    loadComponent: () => import('./pages/usuarios/register').then((m) => m.Register),
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
        resolve: { pacientesData: pacientesResolver },
        loadComponent: () => import('./pages/pacientes/lista-pacientes/lista-pacientes').then((m) => m.ListaPacientesComponent),
      },
      {
        path: 'pacientes/:id',
        resolve: { pacienteData: pacienteDetalleResolver },
        loadComponent: () => import('./pages/pacientes/lista-pacientes/lista-pacientes').then((m) => m.ListaPacientesComponent),
      },
      {
        path: 'odontologos',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        resolve: { odontologosData: odontologosResolver },
        loadComponent: () => import('./pages/odontologos/lista-odontologos/lista-odontologos').then((m) => m.ListaOdontologosComponent),
      },
      { path: 'citas', loadComponent: () => import('./pages/citas/citas').then((m) => m.CitasPage) },
      { path: 'agenda', loadComponent: () => import('./pages/agendas/agenda').then((m) => m.AgendaPage) },
    ],
  },
];
