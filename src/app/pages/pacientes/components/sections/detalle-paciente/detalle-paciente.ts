import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Paciente } from '../../../interfaces/patient.interface';

@Component({
  selector: 'app-detalle-paciente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-paciente.html',
  styleUrl: './detalle-paciente.scss',
})
export class DetallePacienteComponent {
  @Input() paciente: Paciente | null = null;
  @Output() cerrar = new EventEmitter<void>();
}
