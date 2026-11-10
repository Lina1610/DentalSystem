import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AgendaStore } from '../store/agenda.store';
import { Agenda, EstadoAgenda } from '../interfaces/agenda.interface';
import { CrearAgendaModalComponent, NuevoHorario } from '../components/modals/crear-agenda-modal/crear-agenda-modal';
import { OdontologoService } from '../../odontologos/services/odontologo.service';
import { Odontologo } from '../../odontologos/interfaces/odontologo.interface';
import { ICONOS_LISTA, TarjetaResumen, esHoy, estiloAvatar, inicialesDe } from '../../../shared/utils/lista';

type FiltroAgenda = 'todos' | EstadoAgenda;

@Component({
  selector: 'app-lista-agendas',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearAgendaModalComponent],
  templateUrl: './lista-agendas.html',
  styleUrl: './lista-agendas.scss',
})
export class ListaAgendasComponent implements OnInit, OnDestroy {
  readonly store = inject(AgendaStore);
  private route = inject(ActivatedRoute);
  private odontologoService = inject(OdontologoService);
  private busqueda$ = new Subject<string>();
  private sub!: Subscription;

  busqueda = '';

  filtro: FiltroAgenda = 'todos';

  // Tarjetas de resumen: también funcionan como filtro por estado
  readonly tarjetas: TarjetaResumen<FiltroAgenda>[] = [
    { filtro: 'todos', label: 'Todos', color: 'blue', icono: ICONOS_LISTA.calendario,
      valor: () => this.store.disponibles() + this.store.ocupados() + this.store.bloqueados() + this.store.noDisponibles() },
    { filtro: 'DISPONIBLE', label: 'Disponibles', color: 'green', icono: ICONOS_LISTA.check,
      valor: () => this.store.disponibles() },
    { filtro: 'OCUPADO', label: 'Ocupados', color: 'amber', icono: ICONOS_LISTA.reloj,
      valor: () => this.store.ocupados() },
    { filtro: 'BLOQUEADO', label: 'Bloqueados', color: 'red', icono: ICONOS_LISTA.bloqueado,
      valor: () => this.store.bloqueados() },
    { filtro: 'NO_DISPONIBLE', label: 'No disponibles', color: 'slate', icono: ICONOS_LISTA.noDisponible,
      valor: () => this.store.noDisponibles() },
  ];

  // Filtros por fecha y odontólogo
  fechaFiltro = '';
  odontologoFiltro: number | null = null;
  readonly odontologos = signal<Odontologo[]>([]);

  readonly iniciales = inicialesDe;
  readonly esHoy = esHoy;
  readonly getAvatarStyle = estiloAvatar;

  get hayFiltros(): boolean {
    return !!(this.busqueda || this.fechaFiltro || this.odontologoFiltro || this.filtro !== 'todos');
  }

  readonly limite = 10;

  paginaActual = 1;

  mostrarCrearModal = false;
  creando = false;
  crearError = '';

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.store.total() / this.limite));
  }

  get desde(): number {
    if (this.store.total() === 0) return 0;
    return Math.min((this.paginaActual - 1) * this.limite + 1, this.store.total());
  }

  get hasta(): number {
    return Math.min(this.paginaActual * this.limite, this.store.total());
  }

  get paginas(): (number | '...')[] {
    const total = this.totalPaginas;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pagina = this.paginaActual;
    const paginas: (number | '...')[] = [1];

    if (pagina > 3) paginas.push('...');
    for (let i = Math.max(2, pagina - 1); i <= Math.min(total - 1, pagina + 1); i++) paginas.push(i);
    if (pagina < total - 2) paginas.push('...');

    paginas.push(total);
    return paginas;
  }

  ngOnInit(): void {
    this.sub = this.busqueda$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((termino) => {
        this.busqueda = termino;
        this.paginaActual = 1;
        this.cargarPagina();
      });

    // Filtro que llega por la URL (p. ej. clic en una tarjeta del dashboard)
    const estadoParam = this.route.snapshot.queryParamMap.get('estado');
    const ESTADOS_VALIDOS = ['DISPONIBLE', 'OCUPADO', 'BLOQUEADO', 'NO_DISPONIBLE'];
    if (estadoParam && ESTADOS_VALIDOS.includes(estadoParam)) {
      this.filtro = estadoParam as EstadoAgenda;
    }

    this.odontologoService.obtenerOdontologos({ limite: 100, estado: 'ACTIVO' }).subscribe({
      next: (res) => { this.odontologos.set(res.data); },
    });

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

  onBuscar(termino: string): void {
    this.busqueda$.next(termino);
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

  setFiltro(filtro: FiltroAgenda): void {
    this.filtro = filtro;
    this.paginaActual = 1;
    this.cargarPagina();
  }

  irPagina(pagina: number | '...'): void {
    if (pagina === '...' || pagina === this.paginaActual) return;
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

  cambiarEstado(id: number, estado: EstadoAgenda): void {
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

  crearHorario(data: NuevoHorario): void {
    this.creando = true;
    this.crearError = '';
    this.store.crear(
      data as unknown as Agenda,
      () => {
        this.creando = false;
        this.cerrarCrearModal();
        const ultimaPagina = Math.ceil(this.store.total() / this.limite);
        this.paginaActual = ultimaPagina;
        this.cargarPagina();
      },
      (msg) => {
        this.creando = false;
        this.crearError = msg;
      }
    );
  }

  trackByHorario(_index: number, horario: Agenda): number {
    return horario.id_agenda!;
  }
}
