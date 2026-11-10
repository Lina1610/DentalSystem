import { Injectable, signal, computed, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardService } from '../services/dashboard.service';
import { EstadoCita, PeriodoDashboard, ResumenDashboard } from '../interfaces/dashboard.interface';

// Orden y etiquetas con que se muestran los estados de cita
const ESTADOS: { estado: EstadoCita; etiqueta: string }[] = [
  { estado: 'CONFIRMADA', etiqueta: 'Confirmadas' },
  { estado: 'PENDIENTE',  etiqueta: 'Pendientes' },
  { estado: 'FINALIZADA', etiqueta: 'Finalizadas' },
  { estado: 'CANCELADA',  etiqueta: 'Canceladas' },
];

@Injectable({ providedIn: 'root' })
export class DashboardStore {

  private readonly service = inject(DashboardService);
  private peticion?: Subscription;

  // ── Estado privado ────────────────────────────────────
  private readonly _resumen  = signal<ResumenDashboard | null>(null);
  private readonly _periodo  = signal<PeriodoDashboard | 'personalizado'>('mes');
  private readonly _rango    = signal<{ desde: string; hasta: string } | null>(null);
  private readonly _cargando = signal(false);
  private readonly _error    = signal<string | null>(null);

  // ── Estado público (solo lectura) ─────────────────────
  readonly resumen  = this._resumen.asReadonly();
  readonly periodo  = this._periodo.asReadonly();
  readonly rango    = this._rango.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error    = this._error.asReadonly();

  // ── Computed: datos listos para los componentes ───────
  readonly kpis          = computed(() => this._resumen()?.kpis ?? null);
  readonly proximasCitas = computed(() => this._resumen()?.proximas_citas ?? []);

  readonly citasPorEstado = computed(() => {
    const porEstado = this._resumen()?.citas_por_estado;
    return ESTADOS.map(({ estado, etiqueta }) => ({
      clave: estado,
      etiqueta,
      valor: porEstado?.[estado] ?? 0,
    }));
  });

  readonly citasPorOdontologo = computed(() =>
    (this._resumen()?.citas_por_odontologo ?? []).map(o => ({
      clave: o.id_odontologo,
      etiqueta: o.odontologo,
      valor: o.total,
    }))
  );

  readonly serviciosTop = computed(() =>
    (this._resumen()?.servicios_top ?? []).map(s => ({
      clave: s.id_servicio,
      etiqueta: s.servicio,
      valor: s.total,
    }))
  );

  readonly ingresosMensuales = computed(() => this._resumen()?.ingresos_mensuales ?? []);

  readonly totalCitasPeriodo = computed(() =>
    this.citasPorEstado().reduce((suma, e) => suma + e.valor, 0)
  );

  // ── Acciones ──────────────────────────────────────────
  // Periodo predefinido (hoy, semana, mes, 30dias)
  cargar(periodo: PeriodoDashboard = 'mes'): void {
    this._periodo.set(periodo);
    this._rango.set(null);
    this.pedir({ periodo });
  }

  // Rango personalizado 'YYYY-MM-DD' (el backend valida orden y máximo de 366 días)
  cargarRango(desde: string, hasta: string): void {
    this._periodo.set('personalizado');
    this._rango.set({ desde, hasta });
    this.pedir({ desde, hasta });
  }

  recargar(): void {
    const rango = this._rango();
    const periodo = this._periodo();
    if (rango) {
      this.pedir(rango);
    } else if (periodo !== 'personalizado') {
      this.pedir({ periodo });
    }
  }

  private pedir(opts: { periodo?: PeriodoDashboard; desde?: string; hasta?: string }): void {
    this._cargando.set(true);
    this._error.set(null);

    // Si el usuario cambia de periodo rápido, se descarta la respuesta anterior
    this.peticion?.unsubscribe();
    this.peticion = this.service.obtenerResumen(opts).subscribe({
      next: (res) => {
        this._resumen.set(res);
        this._cargando.set(false);
      },
      error: (err) => {
        this._error.set(
          err?.status === 0
            ? 'No se pudo conectar con el servidor.'
            : err?.error?.message ?? err?.error?.errores?.[0]?.mensaje ?? 'Error al cargar el dashboard.'
        );
        this._cargando.set(false);
      },
    });
  }
}
