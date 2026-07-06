import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <h2 class="page-title">Dashboard</h2>
    <p class="page-sub">Resumen general del consultorio.</p>
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f2744; margin: 0 0 0.5rem; }
    .page-sub { color: #6b7280; margin: 0; }
  `]
})
export class DashboardPage {}
