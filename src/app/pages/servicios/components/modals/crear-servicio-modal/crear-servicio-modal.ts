import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Servicio } from '../../../interfaces/servicio.interface';
import { ServicioForm, servicioFormVacio, validarServicio, aServicio, formatearDuracion } from '../../../utils/servicio.utils';

@Component({
  selector: 'app-crear-servicio-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-servicio-modal.html',
  styleUrls: ['./crear-servicio-modal.scss'],
})
export class CrearServicioModalComponent {
  @Input() mostrar   = false;
  @Input() guardando = false;
  @Input() errorMsg  = '';

  @Output() cerrar  = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<Servicio>();

  form: ServicioForm = servicioFormVacio();
  errorLocal = '';

  readonly formatearDuracion = formatearDuracion;

  onGuardar(): void {
    this.errorLocal = validarServicio(this.form);
    if (this.errorLocal) return;
    this.guardar.emit(aServicio(this.form));
  }

  onCerrar(): void {
    this.form = servicioFormVacio();
    this.errorLocal = '';
    this.cerrar.emit();
  }

  // El padre lo llama tras guardar con éxito, para que el próximo registro empiece vacío
  reiniciar(): void {
    this.form = servicioFormVacio();
    this.errorLocal = '';
  }
}
