export interface Servicio {
  id_servicio?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  duracion_minutos: number;
  estado?: 'ACTIVO' | 'INACTIVO';
}
