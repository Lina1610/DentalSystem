import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type TonoKpi = 'blue' | 'green' | 'orange' | 'purple';

// Tarjeta de indicador: título, valor grande, detalle y enlace opcional al módulo.
// El ícono se pasa como contenido: <app-kpi-card><svg icono>...</svg></app-kpi-card>
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a class="kpi" [class.kpi--link]="!!enlace" [routerLink]="enlace || null" [queryParams]="queryParams">
      <div class="kpi__icon" [ngClass]="'kpi__icon--' + tono">
        <ng-content select="[icono]" />
      </div>
      <div class="kpi__body">
        <p class="kpi__titulo">{{ titulo }}</p>
        <p class="kpi__valor">{{ valor }}</p>
        <p class="kpi__detalle" *ngIf="detalle" [class.kpi__detalle--alerta]="alerta" [title]="detalle">{{ detalle }}</p>
      </div>
    </a>
  `,
  styleUrl: './kpi-card.scss',
})
export class KpiCardComponent {
  @Input({ required: true }) titulo = '';
  @Input({ required: true }) valor: string | number = '';
  @Input() detalle = '';
  @Input() tono: TonoKpi = 'blue';
  @Input() enlace = '';
  @Input() queryParams: Record<string, string | number> | null = null;
  // Resalta el detalle (p. ej. citas sin confirmar)
  @Input() alerta = false;
}
