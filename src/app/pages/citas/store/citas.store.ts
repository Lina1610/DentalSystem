import { Injectable, signal, computed, inject } from '@angular/core';
import { CitaService } from '../services/cita.service';
import { Cita, EstadoCita } from '../interfaces/cita.interface';

@Injectable({ providedIn: 'root' })
export class CitaStore {

  private readonly service = inject(CitaService);

  // ── Estado privado ────────────────────────────────────
  private readonly _citas = signal<Cita[]>([]);
  private readonly _total        = signal(0);
  private readonly _pendientes     = signal(0);
  private readonly _confirmadas    = signal(0);
  private readonly _canceladas    = signal(0);
  private readonly _finalizadas   = signal(0);
  private readonly _cargando     = signal(false);
  private readonly _error        = signal<string | null>(null);

  // ── Estado público (solo lectura) ─────────────────────
  readonly citas  = this._citas.asReadonly();
  readonly total        = this._total.asReadonly();
  readonly pendientes     = this._pendientes.asReadonly();
  readonly confirmadas    = this._confirmadas.asReadonly();
  readonly canceladas     = this._canceladas .asReadonly();
  readonly finalizadas   = this._finalizadas.asReadonly();
  readonly cargando     = this._cargando.asReadonly();
  readonly error        = this._error.asReadonly();

  // ── Computed ──────────────────────────────────────────
  readonly hayDatos = computed(() => this._citas().length > 0);

  // ── Acciones ──────────────────────────────────────────
  cargar(opts: { busqueda?: string; pagina?: number; limite?: number; estado?: string } = {}): void {
    this._cargando.set(true);
    this._error.set(null);
    this.service.obtenerCitas(opts).subscribe({
      next: (res) => {
        this._citas.set(res.data);
        this._total.set(res.total);
        this._pendientes.set(res.pendientes);
        this._confirmadas.set(res.confirmadas);
        this._canceladas.set(res.canceladas);
        this._finalizadas.set(res.finalizadas)
        this._cargando.set(false);
      },
      error: (err) => {
        this._error.set(err?.message ?? 'Error al cargar');
        this._cargando.set(false);
      },
    });
  }

private contadorPorEstado(estado: Cita['estado']) {
  switch (estado) {
    case 'PENDIENTE':  return this._pendientes;
    case 'CONFIRMADA': return this._confirmadas;
    case 'CANCELADA':  return this._canceladas;
    case 'FINALIZADA': return this._finalizadas;
    default:           return undefined;
  }
}

private aplicarEstado(idx: number, estado: Cita['estado']): void {
  const estadoAnterior = this._citas()[idx].estado;
  if (estadoAnterior === estado) return;

  this._citas.update(list =>
    list.map((c, i) => i === idx ? { ...c, estado } : c)
  );

  this.contadorPorEstado(estadoAnterior)?.update(n => n - 1);
  this.contadorPorEstado(estado)?.update(n => n + 1);
}

cambiarEstado(id: number, nuevoEstado: EstadoCita): void {
  const idx = this._citas().findIndex(c => c.id_cita === id);
  if (idx === -1) return;

  const estadoAnterior = this._citas()[idx].estado;
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

  crear(data: Cita, onSuccess: () => void, onError: (msg: string) => void): void {
    this.service.crearCita(data).subscribe({
      next: () => {
        this._total.update(n => n + 1);
        onSuccess();
      },
      error: (err) => {
        onError(err?.error?.message ?? (err?.error?.errores?.[0]?.mensaje) ?? 'Error al registrar.');
      },
    });
  }

  actualizar(id: number, data: Partial<Cita>, onSuccess: () => void, onError: (msg: string) => void): void {
    this.service.actualizarCita(id, data).subscribe({
      next: (citaActualizada) => {
        this._citas.update(list =>
          list.map(c => c.id_cita === id ? { ...c, ...citaActualizada } : c)
        );
        onSuccess();
      },
      error: (err) => {
        onError(err?.error?.message ?? (err?.error?.errores?.[0]?.mensaje) ?? 'Error al actualizar.');
      },
    });
  }

  eliminar(id: number, observaciones: string | undefined, onSuccess: () => void, onError: (msg: string) => void): void {
    const idx = this._citas().findIndex(c => c.id_cita === id);
    if (idx === -1) return;

    this.service.eliminarCita(id, observaciones).subscribe({
      next: () => {
        this.aplicarEstado(idx, 'CANCELADA');
        onSuccess();
      },
      error: (err) => {
        onError(err?.error?.message ?? 'Error al cancelar la cita.');
      },
    });
  }
}
