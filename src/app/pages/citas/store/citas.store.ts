import { Injectable, signal, computed, inject } from '@angular/core';
import { CitaService } from '../services/cita.service';
import { Cita } from '../interfaces/cita.interface';

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

  cambiarEstado(id: number): void {
    const idx = this._odontologos().findIndex(o => o.id_odontologo === id);
    if (idx === -1) return;

    const estadoAnterior = this._odontologos()[idx].estado;
    const nuevoEstado    = estadoAnterior === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    // Actualización optimista
    this._odontologos.update(list =>
      list.map((o, i) => i === idx ? { ...o, estado: nuevoEstado } : o)
    );
    this._activos.update(n   => n + (nuevoEstado === 'ACTIVO'   ? 1 : -1));
    this._inactivos.update(n => n + (nuevoEstado === 'INACTIVO' ? 1 : -1));

    this.service.cambiarEstado(id).subscribe({
      error: () => {
        // Revertir si falla
        this._odontologos.update(list =>
          list.map((o, i) => i === idx ? { ...o, estado: estadoAnterior } : o)
        );
        this._activos.update(n   => n + (estadoAnterior === 'ACTIVO'   ? 1 : -1));
        this._inactivos.update(n => n + (estadoAnterior === 'INACTIVO' ? 1 : -1));
      },
    });
  }

  crear(data: Odontologo, onSuccess: () => void, onError: (msg: string) => void): void {
    this.service.crearOdontologo(data).subscribe({
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
