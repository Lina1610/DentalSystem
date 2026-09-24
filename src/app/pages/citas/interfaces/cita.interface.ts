export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA';

export interface Cita {
  id_cita?: number;
  id_paciente: number;
  id_odontologo: number;
  id_servicio: number;
  id_agenda: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo_consulta?: string;
  estado?: EstadoCita;
  observaciones?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  paciente_documento?: string;
  paciente_nombre?: string;
  odontologo_nombre?: string;
  servicio_nombre?: string;
}