export interface Cita {
  id_cita?: number;
  id_paciente: number;
  id_odontologo: number;
  id_servicio: number;
  id_agenda: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo_consulta?: string;
  estado?: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA';
  observaciones?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}