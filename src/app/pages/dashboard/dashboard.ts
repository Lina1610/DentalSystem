import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { DashboardStore } from './store/dashboard.store';
import { HorariosLibres, PeriodoDashboard } from './interfaces/dashboard.interface';
import { KpiCardComponent } from './components/kpi-card/kpi-card';
import { BarrasHorizontalesComponent, ItemBarra } from './components/barras-horizontales/barras-horizontales';
import { ProximasCitasComponent } from './components/proximas-citas/proximas-citas';
import { IngresosMensualesComponent } from './components/ingresos-mensuales/ingresos-mensuales';
import { formatearMoneda } from '../../shared/utils/formato';

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
const formatoDia   = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });

// 'YYYY-MM-DD' → Date local (sin desfase de zona horaria)
const aFecha = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    KpiCardComponent,
    BarrasHorizontalesComponent,
    ProximasCitasComponent,
    IngresosMensualesComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage implements OnInit {

  readonly store = inject(DashboardStore);
  private readonly router = inject(Router);

  // Fecha de hoy en formato YYYY-MM-DD (hora local), para filtrar "Citas hoy"
  readonly hoy = new Date().toLocaleDateString('sv-SE');

  readonly periodos: { valor: PeriodoDashboard; etiqueta: string }[] = [
    { valor: 'hoy',    etiqueta: 'Hoy' },
    { valor: 'semana', etiqueta: 'Esta semana' },
    { valor: 'mes',    etiqueta: 'Este mes' },
    { valor: '30dias', etiqueta: 'Últimos 30 días' },
  ];

  // Mismos colores que los estados de cita en el resto del sistema (_list-page.scss)
  readonly coloresEstado: Record<string, string> = {
    CONFIRMADA: '#16a34a',
    PENDIENTE:  '#ea580c',
    FINALIZADA: '#4f46e5',
    CANCELADA:  '#dc2626',
  };

  readonly formatearMoneda = formatearMoneda;

  // Texto del rango, p. ej. "1 oct 2026 – 31 oct 2026" o un solo día
  readonly rangoTexto = computed(() => {
    const periodo = this.store.resumen()?.periodo;
    if (!periodo) return '';
    const desde = formatoFecha.format(aFecha(periodo.desde));
    const hasta = formatoFecha.format(aFecha(periodo.hasta));
    return desde === hasta ? desde : `${desde} – ${hasta}`;
  });

  // Primera carga: aún no hay datos que mostrar
  readonly cargandoInicial = computed(() => this.store.cargando() && !this.store.resumen());

  // ── Rango personalizado ───────────────────────────────
  mostrarRango = false;
  rangoDesde   = '';
  rangoHasta   = '';
  rangoError   = '';

  ngOnInit(): void {
    this.store.cargar();
  }

  cambiarPeriodo(periodo: PeriodoDashboard): void {
    this.mostrarRango = false;
    if (periodo !== this.store.periodo()) {
      this.store.cargar(periodo);
    }
  }

  abrirRango(): void {
    // Arranca con las fechas que se están viendo
    const actual = this.store.rango() ?? this.store.resumen()?.periodo;
    this.rangoDesde   = actual?.desde ?? '';
    this.rangoHasta   = actual?.hasta ?? '';
    this.rangoError   = '';
    this.mostrarRango = !this.mostrarRango;
  }

  aplicarRango(): void {
    if (!this.rangoDesde || !this.rangoHasta) {
      this.rangoError = 'Elige ambas fechas';
      return;
    }
    if (this.rangoDesde > this.rangoHasta) {
      this.rangoError = 'La fecha inicial no puede ser posterior a la final';
      return;
    }
    this.rangoError = '';
    this.store.cargarRango(this.rangoDesde, this.rangoHasta);
  }

  // ── Textos de los indicadores ─────────────────────────
  detalleCitasHoy(total: number, sinConfirmar: number): string {
    if (!total) return 'No hay citas para hoy';
    return sinConfirmar ? `${sinConfirmar} sin confirmar` : 'Todas confirmadas';
  }

  // "Próximo: vie, 24 de oct · 08:00 · Juan Perez", o alerta si no queda ninguno
  detalleHorariosLibres(libres: HorariosLibres): string {
    const p = libres.proximo;
    if (!p) return 'No quedan horarios: crea agenda';
    return `Próximo: ${formatoDia.format(aFecha(p.fecha))} · ${p.hora_inicio.slice(0, 5)} · ${p.odontologo}`;
  }

  detalleIngresos(porCobrar: number): string {
    return porCobrar ? `${formatearMoneda(porCobrar)} por cobrar` : 'Sin saldos pendientes';
  }

  // ── Navegación desde los gráficos ──────────────────────
  irACitasPorEstado(item: ItemBarra): void {
    this.router.navigate(['/admin/citas'], { queryParams: { estado: item.clave } });
  }

  irACitasPorOdontologo(item: ItemBarra): void {
    this.router.navigate(['/admin/citas'], { queryParams: { id_odontologo: item.clave } });
  }
}
