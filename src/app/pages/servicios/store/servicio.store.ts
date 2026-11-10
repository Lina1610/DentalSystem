import { Injectable, signal, computed, inject } from '@angular/core';
import { ServicioService } from '../services/servicio.service';
import { Servicio } from '../interfaces/servicio.interface';

// Extrae el mensaje del backend (error de negocio o primer error de validación)
const mensajeError = (err: any, porDefecto: string): string =>
  err?.error?.message ?? err?.error?.errores?.[0]?.mensaje ?? porDefecto;

@Injectable({ providedIn: 'root' })
export class ServicioStore {

  private readonly service = inject(ServicioService);

  // ── Estado privado ────────────────────────────────────
  private readonly _servicios = signal<Servicio[]>([]);
  private readonly _total     = signal(0);
  private readonly _activos   = signal(0);
  private readonly _inactivos = signal(0);
  private readonly _cargando  = signal(false);
  private readonly _error     = signal<string | null>(null);

  // ── Estado público (solo lectura) ─────────────────────
  readonly servicios = this._servicios.asReadonly();
  readonly total     = this._total.asReadonly();
  readonly activos   = this._activos.asReadonly();
  readonly inactivos = this._inactivos.asReadonly();
  readonly cargando  = this._cargando.asReadonly();
  readonly error     = this._error.asReadonly();

  // ── Computed ──────────────────────────────────────────
  readonly hayDatos = computed(() => this._servicios().length > 0);

  // ── Acciones ──────────────────────────────────────────
  cargar(opts: { busqueda?: string; pagina?: number; limite?: number; estado?: string } = {}): void {
    this._cargando.set(true);
    this._error.set(null);
    this.service.obtenerServicios(opts).subscribe({
      next: (res) => {
        this._servicios.set(res.data);
        this._total.set(res.total);
        this._activos.set(res.activos);
        this._inactivos.set(res.inactivos);
        this._cargando.set(false);
      },
      error: (err) => {
        this._error.set(mensajeError(err, 'Error al cargar los servicios'));
        this._cargando.set(false);
      },
    });
  }

  cambiarEstado(id: number): void {
    const idx = this._servicios().findIndex(s => s.id_servicio === id);
    if (idx === -1) return;

    const estadoAnterior = this._servicios()[idx].estado;
    const nuevoEstado    = estadoAnterior === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    // Actualización optimista
    this.aplicarEstado(idx, nuevoEstado);

    this.service.cambiarEstado(id).subscribe({
      error: (err) => {
        // Revertir si falla
        this.aplicarEstado(idx, estadoAnterior!);
        this._error.set(mensajeError(err, 'No se pudo cambiar el estado del servicio'));
      },
    });
  }

  crear(data: Servicio, onSuccess: () => void, onError: (msg: string) => void): void {
    this.service.crearServicio(data).subscribe({
      next: () => {
        this._total.update(n => n + 1);
        onSuccess();
      },
      error: (err) => onError(mensajeError(err, 'Error al registrar el servicio.')),
    });
  }

  actualizar(id: number, data: Partial<Servicio>, onSuccess: () => void, onError: (msg: string) => void): void {
    this.service.actualizarServicio(id, data).subscribe({
      next: (actualizado) => {
        this._servicios.update(list =>
          list.map(s => s.id_servicio === id ? { ...s, ...actualizado } : s)
        );
        onSuccess();
      },
      error: (err) => onError(mensajeError(err, 'Error al guardar los cambios.')),
    });
  }

  private aplicarEstado(idx: number, estado: 'ACTIVO' | 'INACTIVO'): void {
    const anterior = this._servicios()[idx].estado;
    if (anterior === estado) return;

    this._servicios.update(list =>
      list.map((s, i) => i === idx ? { ...s, estado } : s)
    );
    this._activos.update(n   => n + (estado === 'ACTIVO'   ? 1 : -1));
    this._inactivos.update(n => n + (estado === 'INACTIVO' ? 1 : -1));
  }
}
