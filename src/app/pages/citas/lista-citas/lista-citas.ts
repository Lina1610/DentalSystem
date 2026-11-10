import { Component, HostListener, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CitaStore } from '../store/citas.store';
import { Cita, EstadoCita } from '../interfaces/cita.interface';
import { CrearCitaModal, NuevaCita } from '../components/modals/crear-cita-modal/crear-cita-modal';
import { EditarCitaModal, CitaEditada } from '../components/modals/editar-cita-modal/editar-cita-modal';
import { OdontologoService } from '../../odontologos/services/odontologo.service';
import { Odontologo } from '../../odontologos/interfaces/odontologo.interface';
import { ICONOS_LISTA, TarjetaResumen, esHoy, estiloAvatar, inicialesDe } from '../../../shared/utils/lista';

type FiltroEstado = 'todos' | EstadoCita;

@Component({
  selector: 'app-lista-citas',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearCitaModal, EditarCitaModal],
  templateUrl: './lista-citas.html',
  styleUrl: './lista-citas.scss',
})
export class ListaCitasComponent implements OnInit, OnDestroy {
  readonly store = inject(CitaStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private odontologoService = inject(OdontologoService);
  private busqueda$ = new Subject<string>();
  private sub!: Subscription;

  busqueda = '';

  filtro: FiltroEstado = 'todos';

  // Tarjetas de resumen: también funcionan como filtro por estado
  readonly tarjetas: TarjetaResumen<FiltroEstado>[] = [
    { filtro: 'todos', label: 'Todas', color: 'blue', icono: ICONOS_LISTA.calendario,
      valor: () => this.store.totalGeneral() },
    { filtro: 'PENDIENTE', label: 'Pendientes', color: 'amber', icono: ICONOS_LISTA.reloj,
      valor: () => this.store.pendientes() },
    { filtro: 'CONFIRMADA', label: 'Confirmadas', color: 'green', icono: ICONOS_LISTA.check,
      valor: () => this.store.confirmadas() },
    { filtro: 'FINALIZADA', label: 'Finalizadas', color: 'violet', icono: ICONOS_LISTA.finalizado,
      valor: () => this.store.finalizadas() },
    { filtro: 'CANCELADA', label: 'Canceladas', color: 'red', icono: ICONOS_LISTA.cancelado,
      valor: () => this.store.canceladas() },
  ];

  readonly iniciales = inicialesDe;
  readonly esHoy = esHoy;
  readonly getAvatarStyle = estiloAvatar;

  // Filtros por fecha y odontólogo (también pueden llegar por query params desde el dashboard)
  fechaFiltro = '';
  odontologoFiltro: number | null = null;
  readonly odontologos = signal<Odontologo[]>([]);

  // Id de la cita cuyo menú de acciones (⋯) está abierto
  menuAccionesId: number | null = null;

  readonly limite = 10;

  paginaActual = 1;

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.store.total() / this.limite));
  }

  get desde(): number {
    if (this.store.total() === 0) {
      return 0;
    }

    return Math.min((this.paginaActual - 1) * this.limite + 1, this.store.total());
  }

  get hasta(): number {
    return Math.min(this.paginaActual * this.limite, this.store.total());
  }

  get paginas(): (number | '...')[] {
    const total = this.totalPaginas;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pagina = this.paginaActual;

    const paginas: (number | '...')[] = [1];

    if (pagina > 3) {
      paginas.push('...');
    }

    for (let i = Math.max(2, pagina - 1); i <= Math.min(total - 1, pagina + 1); i++) {
      paginas.push(i);
    }

    if (pagina < total - 2) {
      paginas.push('...');
    }

    paginas.push(total);

    return paginas;
  }

  mostrarCrearModal = false;
  creando = false;
  crearError = '';

  mostrarEditarModal = false;
  editando = false;
  editarError = '';
  citaEnEdicion: Cita | null = null;

  cancelandoId: number | null = null;

  ngOnInit(): void {
    this.sub = this.busqueda$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((termino) => {
        this.busqueda = termino;
        this.paginaActual = 1;

        this.cargarPagina();
      });

    // Filtros que llegan por la URL (p. ej. clic en una tarjeta del dashboard)
    const params = this.route.snapshot.queryParamMap;
    const estadoParam = params.get('estado');
    const ESTADOS_VALIDOS = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA'];
    if (estadoParam && ESTADOS_VALIDOS.includes(estadoParam)) {
      this.filtro = estadoParam as FiltroEstado;
    }

    this.fechaFiltro = params.get('fecha') ?? '';

    const odontologoParam = Number(params.get('id_odontologo'));
    this.odontologoFiltro = Number.isInteger(odontologoParam) && odontologoParam > 0 ? odontologoParam : null;

    this.odontologoService.obtenerOdontologos({ limite: 100, estado: 'ACTIVO' }).subscribe({
      next: (res) => { this.odontologos.set(res.data); },
    });

    // Botón "Nueva cita" del encabezado: abre el modal y limpia el parámetro de la URL
    this.sub.add(
      this.route.queryParamMap.subscribe((qp) => {
        if (qp.get('nuevo') === '1') {
          this.abrirCrearModal();
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { nuevo: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }
      }),
    );

    this.cargarPagina();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.busqueda$.complete();
  }

  cargarPagina(): void {
    const estado = this.filtro === 'todos' ? '' : this.filtro;

    this.store.cargar({
      busqueda: this.busqueda,
      pagina: this.paginaActual,
      limite: this.limite,
      estado,
      fecha: this.fechaFiltro,
      id_odontologo: this.odontologoFiltro ?? undefined,
    });
  }

  get hayFiltros(): boolean {
    return !!(this.busqueda || this.fechaFiltro || this.odontologoFiltro || this.filtro !== 'todos');
  }

  setFechaFiltro(fecha: string): void {
    this.fechaFiltro = fecha;
    this.paginaActual = 1;
    this.cargarPagina();
  }

  setOdontologoFiltro(id: number | null): void {
    this.odontologoFiltro = id;
    this.paginaActual = 1;
    this.cargarPagina();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.fechaFiltro = '';
    this.odontologoFiltro = null;
    this.filtro = 'todos';
    this.paginaActual = 1;
    this.cargarPagina();
  }

  onBuscar(termino: string): void {
    this.busqueda$.next(termino);
  }

  esCerrada(cita: Cita): boolean {
    return cita.estado === 'CANCELADA' || cita.estado === 'FINALIZADA';
  }

  verPaciente(cita: Cita): void {
    this.router.navigate(['/admin/pacientes', cita.id_paciente]);
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

  setFiltro(filtro: FiltroEstado): void {
    this.filtro = filtro;
    this.paginaActual = 1;

    this.cargarPagina();
  }

  irPagina(pagina: number | '...'): void {
    if (pagina === '...' || pagina === this.paginaActual) {
      return;
    }

    this.paginaActual = pagina as number;

    this.cargarPagina();
  }

  anterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;

      this.cargarPagina();
    }
  }

  siguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;

      this.cargarPagina();
    }
  }

  cambiarEstado(id: number, estado: EstadoCita): void {
    this.store.cambiarEstado(id, estado);
  }
  abrirCrearModal(): void {
    this.crearError = '';
    this.creando = false;
    this.mostrarCrearModal = true;
  }

  cerrarCrearModal(): void {
    this.mostrarCrearModal = false;
    this.crearError = '';
  }

  crearCita(data: NuevaCita): void {
    this.creando = true;
    this.crearError = '';
    this.store.crear(
      data as unknown as Cita,
      () => {
        this.creando = false;
        this.cerrarCrearModal();
        this.cargarPagina();
      },
      (msg) => {
        this.creando = false;
        this.crearError = msg;
      }
    );
  }

  abrirEditarModal(cita: Cita): void {
    this.editarError = '';
    this.editando = false;
    this.citaEnEdicion = cita;
    this.mostrarEditarModal = true;
  }

  cerrarEditarModal(): void {
    this.mostrarEditarModal = false;
    this.editarError = '';
    this.citaEnEdicion = null;
  }

  guardarEdicion(data: CitaEditada): void {
    if (!this.citaEnEdicion?.id_cita) return;

    this.editando = true;
    this.editarError = '';
    this.store.actualizar(
      this.citaEnEdicion.id_cita,
      data,
      () => {
        this.editando = false;
        this.cerrarEditarModal();
      },
      (msg) => {
        this.editando = false;
        this.editarError = msg;
      }
    );
  }

  cancelarCita(cita: Cita): void {
    if (!cita.id_cita) return;
    if (!confirm(`¿Cancelar la cita de ${cita.paciente_nombre ?? 'este paciente'}?`)) return;

    this.cancelandoId = cita.id_cita;
    this.store.eliminar(
      cita.id_cita,
      undefined,
      () => { this.cancelandoId = null; },
      () => { this.cancelandoId = null; }
    );
  }

  trackByCita(_index: number, cita: Cita): number {
    return cita.id_cita!;
  }
}
