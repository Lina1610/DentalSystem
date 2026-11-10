import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IngresoMensual } from '../../interfaces/dashboard.interface';
import { formatearMoneda, formatearMonedaCorta } from '../../../../shared/utils/formato';

const formatoMes = new Intl.DateTimeFormat('es-CO', { month: 'short' });

// Barras verticales de los últimos meses. El alto es proporcional al mes con más ingresos.
@Component({
  selector: 'app-ingresos-mensuales',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ingresos">
      <div class="ingresos__grafica">
        <div class="mes" *ngFor="let m of meses(); trackBy: trackByMes" [title]="etiquetaMes(m.mes) + ': ' + formatearMoneda(m.total)">
          <span class="mes__valor">{{ m.total ? formatearMonedaCorta(m.total) : '' }}</span>
          <span class="mes__pista">
            <span class="mes__barra" [class.mes__barra--vacia]="!m.total" [style.height.%]="alto(m.total)"></span>
          </span>
          <span class="mes__nombre">{{ etiquetaMes(m.mes) }}</span>
        </div>
      </div>
      <p class="ingresos__total">
        Total {{ meses().length }} meses: <strong>{{ formatearMoneda(total()) }}</strong>
      </p>
    </div>
  `,
  styleUrl: './ingresos-mensuales.scss',
})
export class IngresosMensualesComponent {
  @Input({ required: true }) set datos(value: IngresoMensual[]) { this.meses.set(value ?? []); }

  readonly meses = signal<IngresoMensual[]>([]);
  private readonly maximo = computed(() => Math.max(0, ...this.meses().map(m => m.total)));
  readonly total = computed(() => this.meses().reduce((s, m) => s + m.total, 0));

  readonly formatearMoneda = formatearMoneda;
  readonly formatearMonedaCorta = formatearMonedaCorta;

  alto(total: number): number {
    const max = this.maximo();
    return max && total ? Math.max(3, (total / max) * 100) : 0;
  }

  // '2026-05' → 'may'
  etiquetaMes(mes: string): string {
    const [y, m] = mes.split('-').map(Number);
    return formatoMes.format(new Date(y, m - 1, 1)).replace('.', '');
  }

  trackByMes(_i: number, m: IngresoMensual): string {
    return m.mes;
  }
}
