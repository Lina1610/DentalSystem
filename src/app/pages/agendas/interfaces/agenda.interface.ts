export type EstadoAgenda = 'DISPONIBLE' | 'OCUPADO' | 'BLOQUEADO' | 'NO_DISPONIBLE';

export interface Agenda {
  id_agenda?: number;
  id_odontologo: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado?: EstadoAgenda;
  observacion?: string;
  odontologo_nombre?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}
