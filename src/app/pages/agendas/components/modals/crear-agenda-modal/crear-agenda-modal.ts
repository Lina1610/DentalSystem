import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OdontologoService } from '../../../../odontologos/services/odontologo.service';
import { Odontologo } from '../../../../odontologos/interfaces/odontologo.interface';

export interface NuevoHorario {
  id_odontologo: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  observacion?: string;
}

@Component({
  selector: 'app-crear-agenda-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-agenda-modal.html',
  styleUrls: ['./crear-agenda-modal.scss'],
})
export class CrearAgendaModalComponent implements OnInit, OnChanges {
  @Input() mostrar   = false;
  @Input() guardando = false;
  @Input() errorMsg  = '';

  @Output() cerrar  = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<NuevoHorario>();

  private readonly odontologoService = inject(OdontologoService);

  odontologos: Odontologo[] = [];

  form: NuevoHorario = this.formVacio();
  errorLocal = '';

  // Fecha de hoy en formato YYYY-MM-DD, para bloquear fechas pasadas en el date picker
  readonly hoy = new Date().toLocaleDateString('sv-SE');

  ngOnInit(): void {
    this.odontologoService.obtenerOdontologos({ limite: 100, estado: 'ACTIVO' }).subscribe({
      next: (res) => { this.odontologos = res.data; },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mostrar'] && this.mostrar) {
      this.form = this.formVacio();
      this.errorLocal = '';
    }
  }

  private horaActual(): string {
    const ahora = new Date();
    return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  }

  private formVacio(): NuevoHorario {
    return {
      id_odontologo: 0,
      fecha: '',
      hora_inicio: '',
      hora_fin: '',
      observacion: '',
    };
  }

  onGuardar(): void {
    const { id_odontologo, fecha, hora_inicio, hora_fin } = this.form;

    if (!id_odontologo) {
      this.errorLocal = 'Selecciona un odontólogo';
      return;
    }
    if (!fecha) {
      this.errorLocal = 'Selecciona una fecha';
      return;
    }
    if (fecha < this.hoy) {
      this.errorLocal = 'No puedes crear un horario en una fecha pasada';
      return;
    }
    if (!hora_inicio || !hora_fin) {
      this.errorLocal = 'Completa la hora de inicio y de fin';
      return;
    }
    if (hora_fin <= hora_inicio) {
      this.errorLocal = 'La hora de fin debe ser mayor que la hora de inicio';
      return;
    }
    if (fecha === this.hoy && hora_inicio <= this.horaActual()) {
      this.errorLocal = 'Esa hora ya pasó; elige un horario más adelante';
      return;
    }

    this.errorLocal = '';
    this.guardar.emit({ ...this.form });
  }

  onCerrar(): void {
    this.form = this.formVacio();
    this.errorLocal = '';
    this.cerrar.emit();
  }
}
