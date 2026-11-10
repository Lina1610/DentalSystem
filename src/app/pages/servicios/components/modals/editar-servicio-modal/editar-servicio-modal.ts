import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Servicio } from '../../../interfaces/servicio.interface';
import { ServicioForm, servicioFormVacio, validarServicio, aServicio, formatearDuracion } from '../../../utils/servicio.utils';

@Component({
  selector: 'app-editar-servicio-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-servicio-modal.html',
  styleUrls: ['../crear-servicio-modal/crear-servicio-modal.scss'],
})
export class EditarServicioModalComponent {
  @Input() mostrar   = false;
  @Input() guardando = false;
  @Input() errorMsg  = '';

  @Input() set servicio(value: Servicio | null) {
    this.original = value;
    this.form = value
      ? {
          nombre:           value.nombre,
          descripcion:      value.descripcion ?? '',
          precio:           value.precio,
          duracion_minutos: value.duracion_minutos,
        }
      : servicioFormVacio();
    this.errorLocal = '';
  }

  @Output() cerrar  = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<{ id: number; cambios: Servicio }>();

  original: Servicio | null = null;
  form: ServicioForm = servicioFormVacio();
  errorLocal = '';

  readonly formatearDuracion = formatearDuracion;

  onGuardar(): void {
    if (!this.original?.id_servicio) return;
    this.errorLocal = validarServicio(this.form);
    if (this.errorLocal) return;

    const cambios = aServicio(this.form);
    this.guardar.emit({
      id: this.original.id_servicio,
      cambios: { ...cambios, descripcion: cambios.descripcion ?? '' },
    });
  }

  onCerrar(): void {
    this.errorLocal = '';
    this.cerrar.emit();
  }
}
