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
  password: string;
  tarjeta_profesional: string;
  experiencia_anios?: number;
  id_especialidad: number;
  id_consultorio: number;
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
      password:            '',
      tarjeta_profesional: '',
      experiencia_anios:   0,
      id_especialidad:     0,
      id_consultorio:      0,
    };
  }

  onGuardar(): void {
    const { nombres, apellidos, documento, email, username, password, tarjeta_profesional, id_especialidad, id_consultorio } = this.form;
    if (!nombres.trim() || !apellidos.trim() || !documento.trim() ||
        !email.trim()   || !username.trim()  || !password ||
        !tarjeta_profesional.trim()) {
      this.errorLocal = 'Completa todos los campos obligatorios (*)';
      return;
    }
    const problemaPassword = this.validarPassword(password, username, email);
    if (problemaPassword) {
      this.errorLocal = problemaPassword;
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

  private validarPassword(password: string, username: string, email: string): string {
    if (password.length < 8) return 'La contraseña debe tener mínimo 8 caracteres';
    if (new TextEncoder().encode(password).length > 72) return 'La contraseña es demasiado larga (máximo 72 bytes)';
    if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) return 'La contraseña debe tener al menos una letra y un número';
    if (password.trim() !== password) return 'La contraseña no puede empezar ni terminar con espacios';
    const p = password.toLowerCase();
    const u = username.trim().toLowerCase();
    const local = email.trim().toLowerCase().split('@')[0];
    if ((u.length >= 3 && p.includes(u)) || (local.length >= 3 && p.includes(local))) {
      return 'La contraseña no puede contener el usuario ni el correo';
    }
    return '';
  }

  onCerrar(): void {
    this.form = this.formVacio();
    this.errorLocal = '';
    this.cerrar.emit();
  }
}
