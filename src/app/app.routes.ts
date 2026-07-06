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
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/pages/register/register').then((m) => m.Register),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/pages/dashboard/dashboard').then((m) => m.DashboardPage) },
      {
        path: 'pacientes',
        resolve: { pacientesData: pacientesResolver },
        loadComponent: () => import('./features/patients/pages/lista-pacientes/lista-pacientes').then((m) => m.ListaPacientesComponent),
      },
      {
        path: 'pacientes/:id',
        resolve: { pacienteData: pacienteDetalleResolver },
        loadComponent: () => import('./features/patients/pages/lista-pacientes/lista-pacientes').then((m) => m.ListaPacientesComponent),
      },
      {
        path: 'odontologos',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        resolve: { odontologosData: odontologosResolver },
        loadComponent: () => import('./features/odontologos/pages/lista-odontologos/lista-odontologos').then((m) => m.ListaOdontologosComponent),
      },
      { path: 'citas', loadComponent: () => import('./features/admin/pages/citas/citas').then((m) => m.CitasPage) },
      { path: 'agenda', loadComponent: () => import('./features/admin/pages/agenda/agenda').then((m) => m.AgendaPage) },
    ],
  },
];
