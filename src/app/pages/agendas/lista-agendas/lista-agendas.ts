import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AgendaStore } from '../store/agenda.store';
import { Agenda, EstadoAgenda } from '../interfaces/agenda.interface';
import { CrearAgendaModalComponent, NuevoHorario } from '../components/modals/crear-agenda-modal/crear-agenda-modal';

@Component({
  selector: 'app-lista-agendas',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearAgendaModalComponent],
  templateUrl: './lista-agendas.html',
  styleUrl: './lista-agendas.scss',
})
export class ListaAgendasComponent implements OnInit, OnDestroy {
  readonly store = inject(AgendaStore);
  private busqueda$ = new Subject<string>();
  private sub!: Subscription;

  busqueda = '';

  filtro: 'todos' | EstadoAgenda = 'todos';

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
    });
  }

  onBuscar(termino: string): void {
    this.busqueda$.next(termino);
  }

  setFiltro(filtro: 'todos' | EstadoAgenda): void {
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
