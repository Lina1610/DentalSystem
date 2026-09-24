import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ServicioService } from '../../../../servicios/services/servicio.service';
import { Servicio } from '../../../../servicios/interfaces/servicio.interface';
import { Cita } from '../../../interfaces/cita.interface';

export interface CitaEditada {
  id_servicio: number;
  motivo_consulta: string;
  observaciones: string;
}

@Component({
  selector: 'app-editar-cita-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-cita-modal.html',
  styleUrls: ['./editar-cita-modal.scss'],
})
export class EditarCitaModal implements OnInit, OnChanges {
  @Input() mostrar   = false;
  @Input() guardando = false;
  @Input() errorMsg  = '';
  @Input() cita: Cita | null = null;

  @Output() cerrar  = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<CitaEditada>();

  private readonly servicioService = inject(ServicioService);
  servicios: Servicio[] = [];

  form: CitaEditada = this.formVacio();
  errorLocal = '';

  ngOnInit(): void {
    this.servicioService.obtenerServicios({ limite: 100, estado: 'ACTIVO' }).subscribe({
      next: (res) => { this.servicios = res.data; },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cita'] && this.cita) {
      this.form = {
        id_servicio: this.cita.id_servicio,
        motivo_consulta: this.cita.motivo_consulta ?? '',
        observaciones: this.cita.observaciones ?? '',
      };
      this.errorLocal = '';
    }
  }

  private formVacio(): CitaEditada {
    return { id_servicio: 0, motivo_consulta: '', observaciones: '' };
  }

  onGuardar(): void {
    if (!this.form.id_servicio) {
      this.errorLocal = 'Selecciona un servicio';
      return;
    }

    this.errorLocal = '';
    this.guardar.emit({ ...this.form });
  }

  onCerrar(): void {
    this.errorLocal = '';
    this.cerrar.emit();
  }
}
