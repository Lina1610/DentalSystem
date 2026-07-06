import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Paciente } from '../../../interfaces/patient.interface';

@Component({
  selector: 'app-editar-paciente-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-paciente-modal.html',
  styleUrl: './editar-paciente-modal.scss',
})
export class EditarPacienteModalComponent {
  @Input() paciente: Paciente | null = null;
  @Input() mostrar = false;
  @Input() errorMsg = '';

  @Input() set guardando(value: boolean) {
    this._guardando = value;
  }
  get guardando(): boolean { return this._guardando; }
  _guardando = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<Paciente>();

  onGuardar(): void {
    if (this.paciente) {
      this.guardar.emit(this.paciente);
    }
  }

  onCerrar(): void {
    this.cerrar.emit();
  }
}
