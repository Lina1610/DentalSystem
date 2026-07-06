import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface NuevoPaciente {
  nombres: string;
  apellidos: string;
  documento: string;
  fecha_nacimiento: string;
  genero: string;
  telefono: string;
  email: string;
  direccion: string;
  id_ciudad: number | null;
  alergias: string;
  observaciones: string;
}

@Component({
  selector: 'app-crear-paciente-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-paciente-modal.html',
  styleUrl: './crear-paciente-modal.scss',
})
export class CrearPacienteModalComponent {
  @Input() mostrar = false;
  @Input() guardando = false;
  @Input() errorMsg = '';

  @Output() cerrar  = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<NuevoPaciente>();

  // Ciudades hardcodeadas (catálogo mínimo del sistema)
  readonly ciudades = [
    { id: 1, nombre: 'Sogamoso', departamento: 'Boyacá' },
    { id: 2, nombre: 'Tunja',    departamento: 'Boyacá' },
  ];

  form: NuevoPaciente = this.formVacio();

  private formVacio(): NuevoPaciente {
    return {
      nombres: '',
      apellidos: '',
      documento: '',
      fecha_nacimiento: '',
      genero: '',
      telefono: '',
      email: '',
      direccion: '',
      id_ciudad: null,
      alergias: '',
      observaciones: '',
    };
  }

  camposRequeridos = ['nombres', 'apellidos', 'documento', 'fecha_nacimiento', 'genero', 'telefono'] as const;
  errorLocal = '';

  onGuardar(): void {
    // Validación frontend antes de enviar
    for (const campo of this.camposRequeridos) {
      if (!this.form[campo]?.trim()) {
        this.errorLocal = 'Completa todos los campos obligatorios (*)';
        return;
      }
    }
    if (!this.form.id_ciudad) {
      this.errorLocal = 'Selecciona una ciudad';
      return;
    }
    this.errorLocal = '';
    this.guardar.emit(this.form);
  }

  onCerrar(): void {
    this.form = this.formVacio();
    this.cerrar.emit();
  }
}
