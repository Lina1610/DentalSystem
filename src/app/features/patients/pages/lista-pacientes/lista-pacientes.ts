import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PacienteService } from '../../services/patient.service';
import { Paciente } from '../../interfaces/patient.interface';
import { DetallePacienteComponent } from '../../components/sections/detalle-paciente/detalle-paciente';
import { EditarPacienteModalComponent } from '../../components/modals/editar-paciente-modal/editar-paciente-modal';
import { CrearPacienteModalComponent, NuevoPaciente } from '../../components/modals/crear-paciente-modal/crear-paciente-modal';

@Component({
  selector: 'app-lista-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule, DetallePacienteComponent, EditarPacienteModalComponent, CrearPacienteModalComponent],
  templateUrl: './lista-pacientes.html',
  styleUrl: './lista-pacientes.scss',
})
export class ListaPacientesComponent implements OnInit, OnDestroy {
  private pacienteService = inject(PacienteService);
  private cdr            = inject(ChangeDetectorRef);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private busqueda$      = new Subject<string>();
  private sub!: Subscription;

  // ── Datos ─────────────────────────────────────────────
  pacientes:    Paciente[] = [];
  busqueda      = '';
  cargando      = false;
  filtro: 'todos' | 'activos' | 'inactivos' = 'todos';
  pacienteDetalle: Paciente | null = null;

  // ── Paginación ────────────────────────────────────────
  readonly limite      = 10;
  paginaActual         = 1;
  totalRegistros       = 0;
  totalPacientesActivos   = 0;
  totalPacientesInactivos = 0;

  get totalPaginas(): number { return Math.max(1, Math.ceil(this.totalRegistros / this.limite)); }
  get desde(): number { return Math.min((this.paginaActual - 1) * this.limite + 1, this.totalRegistros); }
  get hasta(): number { return Math.min(this.paginaActual * this.limite, this.totalRegistros); }

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

  // ── Modal edición ─────────────────────────────────────
  mostrarModal   = false;
  guardando      = false;
  guardandoError = '';
  pacienteEditando: Paciente | null = null;

  // ── Modal crear ───────────────────────────────────────
  mostrarCrearModal = false;
  creando    = false;
  crearError = '';

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

  // ── Ciclo de vida ─────────────────────────────────────
  ngOnInit(): void {
    // Búsqueda con debounce → siempre vuelve a página 1
    this.sub = this.busqueda$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe(termino => {
      this.busqueda     = termino;
      this.paginaActual = 1;
      this.cargarPagina();
    });

    this.cargarPagina();

    // Menú "Crear" → abre modal automáticamente
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

  // ── Carga con paginación ──────────────────────────────
  cargarPagina(): void {
    this.cargando = true;
    const estado = this.filtro === 'activos' ? 'ACTIVO'
                 : this.filtro === 'inactivos' ? 'INACTIVO' : '';
    this.pacienteService.obtenerPacientes({
      busqueda: this.busqueda,
      pagina:   this.paginaActual,
      limite:   this.limite,
      estado,
    }).subscribe({
      next: (res) => {
        this.pacientes                = res.data;
        this.totalRegistros           = res.total;
        this.totalPacientesActivos    = res.activos;
        this.totalPacientesInactivos  = res.inactivos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  onBuscar(termino: string): void {
    this.busqueda$.next(termino);
  }

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

  // ── Cambiar estado ────────────────────────────────────
  cambiarEstado(id: number): void {
    const idx = this.pacientes.findIndex(p => p.id_paciente === id);
    if (idx === -1) return;
    const estadoAnterior = this.pacientes[idx].estado;
    const nuevoEstado    = estadoAnterior === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    this.pacientes = this.pacientes.map((p, i) => i === idx ? { ...p, estado: nuevoEstado } : p);
    // Actualizar contadores optimistamente
    this.totalPacientesActivos   += nuevoEstado === 'ACTIVO' ? 1 : -1;
    this.totalPacientesInactivos += nuevoEstado === 'INACTIVO' ? 1 : -1;
    this.cdr.detectChanges();

    this.pacienteService.cambiarEstado(id).subscribe({
      error: (err) => {
        console.error(err);
        this.pacientes = this.pacientes.map((p, i) => i === idx ? { ...p, estado: estadoAnterior } : p);
        this.totalPacientesActivos   += estadoAnterior === 'ACTIVO' ? 1 : -1;
        this.totalPacientesInactivos += estadoAnterior === 'INACTIVO' ? 1 : -1;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Modal editar ──────────────────────────────────────
  abrirEditar(paciente: Paciente): void {
    this.pacienteEditando = {
      ...paciente,
      fecha_nacimiento: paciente.fecha_nacimiento
        ? paciente.fecha_nacimiento.toString().substring(0, 10) : '',
    };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal     = false;
    this.pacienteEditando = null;
    this.guardandoError   = '';
  }

  guardarCambios(paciente: Paciente): void {
    if (!paciente.id_paciente) return;
    this.guardando      = true;
    this.guardandoError = '';
    this.pacienteService.actualizarPaciente(paciente.id_paciente, paciente).subscribe({
      next: () => {
        this.guardando      = false;
        this.guardandoError = '';
        this.pacientes = this.pacientes.map(p =>
          p.id_paciente === paciente.id_paciente ? { ...p, ...paciente } : p
        );
        this.cerrarModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.guardando      = false;
        this.guardandoError = err?.error?.message ?? (err?.error?.errores?.[0]?.mensaje) ?? 'Error al guardar.';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Modal crear ───────────────────────────────────────
  abrirCrearModal(): void {
    this.crearError       = '';
    this.mostrarCrearModal = true;
  }

  cerrarCrearModal(): void {
    this.mostrarCrearModal = false;
    this.crearError        = '';
  }

  registrarPaciente(data: NuevoPaciente): void {
    this.creando    = true;
    this.crearError = '';
    this.pacienteService.crearPaciente(data as unknown as Paciente).subscribe({
      next: () => {
        this.creando = false;
        this.cerrarCrearModal();
        // Recargar la última página (o ir a la última si se añadió una fila nueva)
        this.totalRegistros++;
        const ultimaPagina = Math.ceil(this.totalRegistros / this.limite);
        this.paginaActual  = ultimaPagina;
        this.cargarPagina();
      },
      error: (err) => {
        console.error(err);
        this.creando    = false;
        this.crearError = err?.error?.message ?? (err?.error?.errores?.[0]?.mensaje) ?? 'Error al registrar.';
        this.cdr.detectChanges();
      },
    });
  }

  trackByPaciente(_index: number, paciente: Paciente): number {
    return paciente.id_paciente!;
  }
}

