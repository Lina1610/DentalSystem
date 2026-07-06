import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface NuevoOdontologo {
  nombres: string;
  apellidos: string;
  documento: string;
  telefono?: string;
  email: string;
  username: string;
  password_hash: string;
  tarjeta_profesional: string;
  experiencia_anios?: number;
  id_especialidad: number;
  id_consultorio: number;
  id_rol?: number;
}
@Component({
  selector: 'app-crear-odontologo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-odontologo-modal.html',
  styleUrls: ['./crear-odontologo-modal.scss'],
})
export class CrearOdontologoModalComponent {
  @Input() mostrar   = false;
  @Input() guardando = false;
  @Input() errorMsg  = '';

  @Output() cerrar  = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<NuevoOdontologo>();

  readonly especialidades = [
    { id: 1, nombre: 'Odontología General' },
    { id: 2, nombre: 'Ortodoncia' },
    { id: 3, nombre: 'Endodoncia' },
  ];

  readonly consultorios = [
    { id: 1, nombre: 'Consultorio Sonrisa Perfecta' },
  ];

  form: NuevoOdontologo = this.formVacio();
  errorLocal = '';

  private formVacio(): NuevoOdontologo {
    return {
      nombres:             '',
      apellidos:           '',
      documento:           '',
      telefono:            '',
      email:               '',
      username:            '',
      password_hash:       '',
      tarjeta_profesional: '',
      experiencia_anios:   0,
      id_especialidad:     0,
      id_consultorio:      0,
      id_rol:              2,
    };
  }

  onGuardar(): void {
    const { nombres, apellidos, documento, email, username, password_hash, tarjeta_profesional, id_especialidad, id_consultorio } = this.form;
    if (!nombres.trim() || !apellidos.trim() || !documento.trim() ||
        !email.trim()   || !username.trim()  || !password_hash.trim() ||
        !tarjeta_profesional.trim()) {
      this.errorLocal = 'Completa todos los campos obligatorios (*)';
      return;
    }
    if (!id_especialidad) {
      this.errorLocal = 'Selecciona una especialidad';
      return;
    }
    if (!id_consultorio) {
      this.errorLocal = 'Selecciona un consultorio';
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
