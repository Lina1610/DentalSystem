import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { pacienteDetalleResolver, pacientesResolver } from './core/resolvers/pacientes.resolver';
import { odontologosResolver } from './core/resolvers/odontologos.resolver';
import { citasResolver } from './core/resolvers/citas.resolver';
import { agendaResolver } from './core/resolvers/agenda.resolver';

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
      {
        path: 'citas',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        resolve: { citasData: citasResolver },
        loadComponent: () => import('./pages/citas/lista-citas/lista-citas').then((m) => m.ListaCitasComponent),
      },
      {
        path: 'agenda',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        resolve: { agendaData: agendaResolver },
        loadComponent: () => import('./pages/agendas/lista-agendas/lista-agendas').then((m) => m.ListaAgendasComponent),
      },
    ],
  },
];
