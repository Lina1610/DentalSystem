import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PacienteService } from '../../../../pacientes/services/patient.service';
import { Paciente } from '../../../../pacientes/interfaces/patient.interface';
import { OdontologoService } from '../../../../odontologos/services/odontologo.service';
import { Odontologo } from '../../../../odontologos/interfaces/odontologo.interface';
import { ServicioService } from '../../../../servicios/services/servicio.service';
import { Servicio } from '../../../../servicios/interfaces/servicio.interface';
import { AgendaService } from '../../../../agendas/services/agenda.service';
import { Agenda } from '../../../../agendas/interfaces/agenda.interface';

export interface NuevaCita {
  id_paciente: number;
  id_odontologo: number;
  id_servicio: number;
  id_agenda: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo_consulta?: string;
  observaciones?: string;
}

interface FormCita {
  id_paciente: number;
  id_odontologo: number;
  id_servicio: number;
  id_agenda: number;
  motivo_consulta: string;
  observaciones: string;
}

@Component({
  selector: 'app-crear-cita-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-cita-modal.html',
  styleUrls: ['./crear-cita-modal.scss'],
})
export class CrearCitaModal implements OnInit, OnChanges, OnDestroy {
  @Input() mostrar   = false;
  @Input() guardando = false;
  @Input() errorMsg  = '';

  @Output() cerrar  = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<NuevaCita>();

  private readonly pacienteService   = inject(PacienteService);
  private readonly odontologoService = inject(OdontologoService);
  private readonly servicioService   = inject(ServicioService);
  private readonly agendaService     = inject(AgendaService);

  odontologos: Odontologo[] = [];
  servicios: Servicio[] = [];
  horariosDisponibles: Agenda[] = [];
  cargandoHorarios = false;

  // ── Buscador de paciente (autocompletado) ──────────────
  private readonly busquedaPaciente$ = new Subject<string>();
  private subBusquedaPaciente?: Subscription;

  busquedaPaciente = '';
  pacientesEncontrados: Paciente[] = [];
  pacienteSeleccionado: Paciente | null = null;
  buscandoPacientes = false;
  mostrarListaPacientes = false;

  form: FormCita = this.formVacio();
  errorLocal = '';

  ngOnInit(): void {
    this.odontologoService.obtenerOdontologos({ limite: 100, estado: 'ACTIVO' }).subscribe({
      next: (res) => { this.odontologos = res.data; },
    });
    this.servicioService.obtenerServicios({ limite: 100, estado: 'ACTIVO' }).subscribe({
      next: (res) => { this.servicios = res.data; },
    });

    this.subBusquedaPaciente = this.busquedaPaciente$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((termino) => {
        const texto = termino.trim();
        if (!texto) {
          this.pacientesEncontrados = [];
          this.buscandoPacientes = false;
          return;
        }
        this.buscandoPacientes = true;
        this.pacienteService.obtenerPacientes({ busqueda: texto, limite: 8 }).subscribe({
          next: (res) => {
            // La coincidencia exacta de documento va primero (búsqueda típica: escribir el documento completo)
            this.pacientesEncontrados = [...res.data].sort((a, b) => {
              const aExacto = a.documento === texto ? 0 : 1;
              const bExacto = b.documento === texto ? 0 : 1;
              return aExacto - bExacto;
            });
            this.buscandoPacientes = false;
          },
          error: () => { this.buscandoPacientes = false; },
        });
      });
  }

  ngOnDestroy(): void {
    this.subBusquedaPaciente?.unsubscribe();
    this.busquedaPaciente$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mostrar'] && this.mostrar) {
      this.form = this.formVacio();
      this.horariosDisponibles = [];
      this.errorLocal = '';
      this.busquedaPaciente = '';
      this.pacientesEncontrados = [];
      this.pacienteSeleccionado = null;
      this.mostrarListaPacientes = false;
    }
  }

  etiquetaPaciente(p: Paciente): string {
    return `${p.nombres} ${p.apellidos} (${p.documento})`;
  }

  onBuscarPaciente(termino: string): void {
    this.busquedaPaciente = termino;
    this.mostrarListaPacientes = true;

    if (this.pacienteSeleccionado && termino !== this.etiquetaPaciente(this.pacienteSeleccionado)) {
      this.pacienteSeleccionado = null;
      this.form.id_paciente = 0;
    }

    this.busquedaPaciente$.next(termino);
  }

  onFocusPaciente(): void {
    this.mostrarListaPacientes = true;
  }

  onBlurPaciente(): void {
    // Retraso para permitir que el click en un resultado se registre antes de ocultar la lista
    setTimeout(() => { this.mostrarListaPacientes = false; }, 150);
  }

  seleccionarPaciente(p: Paciente): void {
    this.pacienteSeleccionado = p;
    this.form.id_paciente = p.id_paciente!;
    this.busquedaPaciente = this.etiquetaPaciente(p);
    this.pacientesEncontrados = [];
    this.mostrarListaPacientes = false;
  }

  private formVacio(): FormCita {
    return {
      id_paciente: 0,
      id_odontologo: 0,
      id_servicio: 0,
      id_agenda: 0,
      motivo_consulta: '',
      observaciones: '',
    };
  }

  onCambioOdontologo(): void {
    this.form.id_agenda = 0;
    this.horariosDisponibles = [];

    if (!this.form.id_odontologo) return;

    this.cargandoHorarios = true;
    this.agendaService.obtenerDisponibles({ id_odontologo: this.form.id_odontologo }).subscribe({
      next: (horarios) => {
        this.horariosDisponibles = horarios;
        this.cargandoHorarios = false;
      },
      error: () => { this.cargandoHorarios = false; },
    });
  }

  etiquetaHorario(horario: Agenda): string {
    const fecha = new Date(horario.fecha).toLocaleDateString('es-CO');
    return `${fecha} · ${horario.hora_inicio.slice(0, 5)} - ${horario.hora_fin.slice(0, 5)}`;
  }

  onGuardar(): void {
    const { id_paciente, id_odontologo, id_servicio, id_agenda } = this.form;

    if (!id_paciente) {
      this.errorLocal = 'Busca y selecciona un paciente registrado de la lista';
      return;
    }
    if (!id_odontologo) {
      this.errorLocal = 'Selecciona un odontólogo';
      return;
    }
    if (!id_servicio) {
      this.errorLocal = 'Selecciona un servicio';
      return;
    }
    if (!id_agenda) {
      this.errorLocal = 'Selecciona un horario disponible';
      return;
    }

    const horario = this.horariosDisponibles.find(h => h.id_agenda === id_agenda);
    if (!horario) {
      this.errorLocal = 'El horario seleccionado ya no está disponible, elige otro';
      return;
    }

    const soloFecha = horario.fecha.slice(0, 10);

    this.errorLocal = '';
    this.guardar.emit({
      ...this.form,
      fecha_inicio: `${soloFecha}T${horario.hora_inicio}`,
      fecha_fin: `${soloFecha}T${horario.hora_fin}`,
    });
  }

  onCerrar(): void {
    this.form = this.formVacio();
    this.horariosDisponibles = [];
    this.errorLocal = '';
    this.busquedaPaciente = '';
    this.pacientesEncontrados = [];
    this.pacienteSeleccionado = null;
    this.mostrarListaPacientes = false;
    this.cerrar.emit();
  }
}
