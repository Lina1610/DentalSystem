import { Injectable, signal, computed, inject } from '@angular/core';
import { OdontologoService } from '../services/odontologo.service';
import { Odontologo } from '../interfaces/odontologo.interface';

@Injectable({ providedIn: 'root' })
export class OdontologoStore {

  private readonly service = inject(OdontologoService);

  // ── Estado privado ────────────────────────────────────
  private readonly _odontologos  = signal<Odontologo[]>([]);
  private readonly _total        = signal(0);
  private readonly _activos      = signal(0);
  private readonly _inactivos    = signal(0);
  private readonly _cargando     = signal(false);
  private readonly _error        = signal<string | null>(null);

  // ── Estado público (solo lectura) ─────────────────────
  readonly odontologos  = this._odontologos.asReadonly();
  readonly total        = this._total.asReadonly();
  readonly activos      = this._activos.asReadonly();
  readonly inactivos    = this._inactivos.asReadonly();
  readonly cargando     = this._cargando.asReadonly();
  readonly error        = this._error.asReadonly();

  // ── Computed ──────────────────────────────────────────
  readonly hayDatos = computed(() => this._odontologos().length > 0);

  // ── Acciones ──────────────────────────────────────────
  cargar(opts: { busqueda?: string; pagina?: number; limite?: number; estado?: string } = {}): void {
    this._cargando.set(true);
    this._error.set(null);
    this.service.obtenerOdontologos(opts).subscribe({
      next: (res) => {
        this._odontologos.set(res.data);
        this._total.set(res.total);
        this._activos.set(res.activos);
        this._inactivos.set(res.inactivos);
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
