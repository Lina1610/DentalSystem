import { Injectable, signal, computed, inject } from '@angular/core';
import { AgendaService } from '../services/agenda.service';
import { Agenda, EstadoAgenda } from '../interfaces/agenda.interface';

@Injectable({ providedIn: 'root' })
export class AgendaStore {

  private readonly service = inject(AgendaService);

  // ── Estado privado ────────────────────────────────────
  private readonly _horarios      = signal<Agenda[]>([]);
  private readonly _total         = signal(0);
  private readonly _disponibles   = signal(0);
  private readonly _ocupados      = signal(0);
  private readonly _bloqueados    = signal(0);
  private readonly _noDisponibles = signal(0);
  private readonly _cargando      = signal(false);
  private readonly _error         = signal<string | null>(null);

  // ── Estado público (solo lectura) ─────────────────────
  readonly horarios      = this._horarios.asReadonly();
  readonly total         = this._total.asReadonly();
  readonly disponibles   = this._disponibles.asReadonly();
  readonly ocupados      = this._ocupados.asReadonly();
  readonly bloqueados    = this._bloqueados.asReadonly();
  readonly noDisponibles = this._noDisponibles.asReadonly();
  readonly cargando      = this._cargando.asReadonly();
  readonly error         = this._error.asReadonly();

  // ── Computed ──────────────────────────────────────────
  readonly hayDatos = computed(() => this._horarios().length > 0);

  // ── Acciones ──────────────────────────────────────────
  cargar(opts: { busqueda?: string; pagina?: number; limite?: number; id_odontologo?: number; fecha?: string; estado?: string } = {}): void {
    this._cargando.set(true);
    this._error.set(null);
    this.service.obtenerAgendas(opts).subscribe({
      next: (res) => {
        this._horarios.set(res.data);
        this._total.set(res.total);
        this._disponibles.set(res.disponibles);
        this._ocupados.set(res.ocupados);
        this._bloqueados.set(res.bloqueados);
        this._noDisponibles.set(res.no_disponibles);
        this._cargando.set(false);
      },
      error: (err) => {
        this._error.set(err?.message ?? 'Error al cargar');
        this._cargando.set(false);
      },
    });
  }

  private contadorPorEstado(estado: EstadoAgenda | undefined) {
    switch (estado) {
      case 'DISPONIBLE':    return this._disponibles;
      case 'OCUPADO':       return this._ocupados;
      case 'BLOQUEADO':     return this._bloqueados;
      case 'NO_DISPONIBLE': return this._noDisponibles;
      default:              return undefined;
    }
  }

  private aplicarEstado(idx: number, estado: EstadoAgenda): void {
    const estadoAnterior = this._horarios()[idx].estado;
    if (estadoAnterior === estado) return;

    this._horarios.update(list =>
      list.map((h, i) => i === idx ? { ...h, estado } : h)
    );

    this.contadorPorEstado(estadoAnterior)?.update(n => n - 1);
    this.contadorPorEstado(estado)?.update(n => n + 1);
  }

  cambiarEstado(id: number, nuevoEstado: EstadoAgenda): void {
    const idx = this._horarios().findIndex(h => h.id_agenda === id);
    if (idx === -1) return;

    const estadoAnterior = this._horarios()[idx].estado;
    if (!estadoAnterior || estadoAnterior === nuevoEstado) return;

    // Actualización optimista
    this.aplicarEstado(idx, nuevoEstado);

    this.service.cambiarEstado(id, nuevoEstado).subscribe({
      error: () => {
        // Revertir si falla
        this.aplicarEstado(idx, estadoAnterior);
      },
    });
  }

  crear(data: Agenda, onSuccess: () => void, onError: (msg: string) => void): void {
    this.service.crearAgenda(data).subscribe({
      next: () => {
        this._total.update(n => n + 1);
        onSuccess();
      },
      error: (err) => {
        onError(err?.error?.message ?? (err?.error?.errores?.[0]?.mensaje) ?? 'Error al registrar.');
      },
    });
  }
}
