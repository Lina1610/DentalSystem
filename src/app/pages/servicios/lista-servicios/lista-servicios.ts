import { Component, HostListener, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ServicioStore } from '../store/servicio.store';
import { Servicio } from '../interfaces/servicio.interface';
import { CrearServicioModalComponent } from '../components/modals/crear-servicio-modal/crear-servicio-modal';
import { EditarServicioModalComponent } from '../components/modals/editar-servicio-modal/editar-servicio-modal';
import { formatearPrecio, formatearDuracion } from '../utils/servicio.utils';
import { ICONOS_LISTA, TarjetaResumen, estiloAvatar } from '../../../shared/utils/lista';

type FiltroServicio = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-lista-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearServicioModalComponent, EditarServicioModalComponent],
  templateUrl: './lista-servicios.html',
  styleUrl: './lista-servicios.scss',
})
export class ListaServiciosComponent implements OnInit, OnDestroy {

  // ── Store ─────────────────────────────────────────────
  readonly store  = inject(ServicioStore);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private busqueda$ = new Subject<string>();
  private subs: Subscription[] = [];

  @ViewChild(CrearServicioModalComponent) private crearModal?: CrearServicioModalComponent;

  busqueda = '';
  filtro: FiltroServicio = 'todos';

  readonly formatearPrecio   = formatearPrecio;
  readonly formatearDuracion = formatearDuracion;
  readonly getAvatarStyle    = estiloAvatar;
  readonly iconoServicio     = ICONOS_LISTA.etiqueta;

  // Tarjetas de resumen: también funcionan como filtro por estado
  readonly tarjetas: TarjetaResumen<FiltroServicio>[] = [
    { filtro: 'todos', label: 'Todos', color: 'blue', icono: ICONOS_LISTA.etiqueta,
      valor: () => this.store.activos() + this.store.inactivos() },
    { filtro: 'activos', label: 'Activos', color: 'green', icono: ICONOS_LISTA.check,
      valor: () => this.store.activos() },
    { filtro: 'inactivos', label: 'Inactivos', color: 'slate', icono: ICONOS_LISTA.noDisponible,
      valor: () => this.store.inactivos() },
  ];

  // Id del servicio cuyo menú de acciones (⋯) está abierto
  menuAccionesId: number | null = null;

  get hayFiltros(): boolean {
    return !!this.busqueda || this.filtro !== 'todos';
  }

  toggleMenuAcciones(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.menuAccionesId = this.menuAccionesId === id ? null : id;
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  cerrarMenuAcciones(): void {
    this.menuAccionesId = null;
  }

  limpiarFiltros(): void {
    this.busqueda     = '';
    this.filtro       = 'todos';
    this.paginaActual = 1;
    this.cargarPagina();
  }

  // ── Paginación ───────────────────────────────────────
  readonly limite = 10;
  paginaActual    = 1;

  get totalPaginas(): number { return Math.max(1, Math.ceil(this.store.total() / this.limite)); }
  get desde(): number { return Math.min((this.paginaActual - 1) * this.limite + 1, this.store.total()); }
  get hasta(): number { return Math.min(this.paginaActual * this.limite, this.store.total()); }

  get paginas(): (number | '...')[] {
    const t = this.totalPaginas;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    const p = this.paginaActual;
    const pages: (number | '...')[] = [1];
    if (p > 3) pages.push('...');
    for (let i = Math.max(2, p - 1); i <= Math.min(t - 1, p + 1); i++) pages.push(i);
    if (p < t - 2) pages.push('...');
    pages.push(t);
    return pages;
  }

  // ── Modal crear ──────────────────────────────────────
  mostrarCrearModal = false;
  creando           = false;
  crearError        = '';

  // ── Modal editar ─────────────────────────────────────
  servicioEditando: Servicio | null = null;
  guardando         = false;
  editarError       = '';

  ngOnInit(): void {
    this.subs.push(
      this.busqueda$.pipe(
        debounceTime(400),
        distinctUntilChanged(),
      ).subscribe(termino => {
        this.busqueda     = termino;
        this.paginaActual = 1;
        this.cargarPagina();
      })
    );

    this.cargarPagina();

    this.subs.push(
      this.route.queryParamMap.subscribe(params => {
        if (params.get('accion') === 'crear') {
          this.abrirCrearModal();
          this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.busqueda$.complete();
  }

  cargarPagina(): void {
    const estado = this.filtro === 'activos' ? 'ACTIVO'
                 : this.filtro === 'inactivos' ? 'INACTIVO' : '';
    this.store.cargar({
      busqueda: this.busqueda,
      pagina:   this.paginaActual,
      limite:   this.limite,
      estado,
    });
  }

  onBuscar(termino: string): void { this.busqueda$.next(termino); }

  irPagina(p: number | '...'): void {
    if (p === '...' || p === this.paginaActual) return;
    this.paginaActual = p as number;
    this.cargarPagina();
  }
  anterior(): void {
    if (this.paginaActual > 1) { this.paginaActual--; this.cargarPagina(); }
  }
  siguiente(): void {
    if (this.paginaActual < this.totalPaginas) { this.paginaActual++; this.cargarPagina(); }
  }
  setFiltro(f: FiltroServicio): void {
    this.filtro       = f;
    this.paginaActual = 1;
    this.cargarPagina();
  }

  cambiarEstado(id: number): void {
    this.store.cambiarEstado(id);
  }

  // ── Crear ────────────────────────────────────────────
  abrirCrearModal(): void {
    this.crearError        = '';
    this.creando           = false;
    this.mostrarCrearModal = true;
  }
  cerrarCrearModal(): void {
    this.mostrarCrearModal = false;
    this.crearError        = '';
  }
  registrarServicio(data: Servicio): void {
    this.creando    = true;
    this.crearError = '';
    this.store.crear(
      data,
      () => {
        this.creando = false;
        this.crearModal?.reiniciar();
        this.cerrarCrearModal();
        // Ir a la última página, donde aparece el nuevo registro
        this.filtro       = 'todos';
        this.paginaActual = Math.ceil(this.store.total() / this.limite);
        this.cargarPagina();
      },
      (msg) => {
        this.creando    = false;
        this.crearError = msg;
      }
    );
  }

  // ── Editar ───────────────────────────────────────────
  abrirEditar(servicio: Servicio): void {
    this.editarError      = '';
    this.guardando        = false;
    this.servicioEditando = servicio;
  }
  cerrarEditar(): void {
    this.servicioEditando = null;
    this.editarError      = '';
  }
  guardarCambios({ id, cambios }: { id: number; cambios: Servicio }): void {
    this.guardando   = true;
    this.editarError = '';
    this.store.actualizar(
      id,
      cambios,
      () => {
        this.guardando = false;
        this.cerrarEditar();
      },
      (msg) => {
        this.guardando   = false;
        this.editarError = msg;
      }
    );
  }

  trackByServicio(_index: number, s: Servicio): number {
    return s.id_servicio!;
  }
}
