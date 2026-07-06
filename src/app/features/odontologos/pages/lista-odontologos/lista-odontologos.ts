import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { OdontologoStore } from '../../store/odontologo.store';
import { Odontologo } from '../../interfaces/odontologo.interface';
import { CrearOdontologoModalComponent, NuevoOdontologo } from '../../components/modals/crear-odontologo-modal/crear-odontologo-modal';

@Component({
  selector: 'app-lista-odontologos',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearOdontologoModalComponent],
  templateUrl: './lista-odontologos.html',
  styleUrl: './lista-odontologos.scss',
})
export class ListaOdontologosComponent implements OnInit, OnDestroy {

  // ── Store ─────────────────────────────────────────────
  readonly store  = inject(OdontologoStore);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private busqueda$ = new Subject<string>();
  private sub!: Subscription;

  busqueda     = '';
  filtro: 'todos' | 'activos' | 'inactivos' = 'todos';
  odontologos:    Odontologo[] = [];
  

  // ── Paginación ───────────────────────────────────────
  readonly limite = 10;
  paginaActual    = 1;
  totalRegistros       = 0;
  totalOdontologosActivos   = 0;
  totalOdontologosInactivos = 0;

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

  mostrarCrearModal = false;
  creando           = false;
  crearError        = '';

  private readonly avatarColors = [
    { bg: '#f3e8ff', color: '#7c3aed' },
    { bg: '#dbeafe', color: '#1d4ed8' },
    { bg: '#ffedd5', color: '#c2410c' },
    { bg: '#dcfce7', color: '#15803d' },
    { bg: '#ccfbf1', color: '#0f766e' },
    { bg: '#fce7f3', color: '#be185d' },
  ];

  getInitials(nombres: string, apellidos: string): string {
    return (nombres?.[0] ?? '') + (apellidos?.[0] ?? '');
  }
  getAvatarStyle(id: number): object {
    const c = this.avatarColors[(id - 1) % this.avatarColors.length];
    return { 'background-color': c.bg, 'color': c.color };
  }

  ngOnInit(): void {
    this.sub = this.busqueda$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe(termino => {
      this.busqueda     = termino;
      this.paginaActual = 1;
      this.cargarPagina();
    });

    this.cargarPagina();

    this.route.queryParamMap.subscribe(params => {
      if (params.get('accion') === 'crear') {
        this.abrirCrearModal();
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
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
  setFiltro(f: 'todos' | 'activos' | 'inactivos'): void {
    this.filtro       = f;
    this.paginaActual = 1;
    this.cargarPagina();
  }

  cambiarEstado(id: number): void {
    this.store.cambiarEstado(id);
  }


  abrirCrearModal(): void {
    this.crearError        = '';
    this.mostrarCrearModal = true;
  }
  cerrarCrearModal(): void {
    this.mostrarCrearModal = false;
    this.crearError        = '';
  }
  registrarOdontologo(data: NuevoOdontologo): void {
    this.creando    = true;
    this.crearError = '';
    this.store.crear(
      data as unknown as Odontologo,
      () => {
        this.creando = false;
        this.cerrarCrearModal();
        const ultimaPagina = Math.ceil(this.store.total() / this.limite);
        this.paginaActual  = ultimaPagina;
        this.cargarPagina();
      },
      (msg) => {
        this.creando    = false;
        this.crearError = msg;
      }
    );
  }

  trackByOdontologo(_index: number, o: Odontologo): number {
    return o.id_odontologo!;
  }
}

