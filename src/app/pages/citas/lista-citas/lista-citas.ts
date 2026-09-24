import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CitaStore } from '../store/citas.store';
import { Cita, EstadoCita } from '../interfaces/cita.interface';
import { CrearCitaModal, NuevaCita } from '../components/modals/crear-cita-modal/crear-cita-modal';
import { EditarCitaModal, CitaEditada } from '../components/modals/editar-cita-modal/editar-cita-modal';

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
  private busqueda$ = new Subject<string>();
  private sub!: Subscription;

  busqueda = '';

  filtro: 'todos' | 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA' = 'todos';

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

  setFiltro(filtro: 'todos' | 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA'): void {
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
    if (!confirm(`¿Cancelar la cita #${cita.id_cita}?`)) return;

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
