import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProximaCita } from '../../interfaces/dashboard.interface';

const formatoDia  = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
const formatoHora = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });

@Component({
  selector: 'app-proximas-citas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ul class="citas" *ngIf="citas.length; else vacio">
      <li class="cita" *ngFor="let c of citas; trackBy: trackByCita">
        <div class="cita__cuando">
          <span class="cita__hora">{{ hora(c.fecha_inicio) }}</span>
          <span class="cita__dia" [class.cita__dia--hoy]="esHoy(c.fecha_inicio)">
            {{ esHoy(c.fecha_inicio) ? 'Hoy' : dia(c.fecha_inicio) }}
          </span>
        </div>
        <div class="cita__detalle">
          <p class="cita__paciente">{{ c.paciente }}</p>
          <p class="cita__meta">{{ c.odontologo }} · {{ c.servicio }}</p>
        </div>
        <span
          class="cita__estado"
          [class.cita__estado--confirmada]="c.estado === 'CONFIRMADA'"
          [class.cita__estado--pendiente]="c.estado === 'PENDIENTE'"
        >{{ c.estado === 'CONFIRMADA' ? 'Confirmada' : 'Pendiente' }}</span>
      </li>
    </ul>
    <ng-template #vacio>
      <p class="citas__vacio">No hay citas programadas próximamente.</p>
    </ng-template>
  `,
  styleUrl: './proximas-citas.scss',
})
export class ProximasCitasComponent {
  @Input({ required: true }) citas: ProximaCita[] = [];

  hora(fecha: string): string { return formatoHora.format(new Date(fecha)); }
  dia(fecha: string): string  { return formatoDia.format(new Date(fecha)); }

  esHoy(fecha: string): boolean {
    return new Date(fecha).toDateString() === new Date().toDateString();
  }

  trackByCita(_i: number, c: ProximaCita): number {
    return c.id_cita;
  }
}
