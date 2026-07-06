export interface Odontologo {
  id_odontologo?: number;
  id_usuario?: number;
  nombres: string;
  apellidos: string;
  documento: string;
  telefono?: string;
  email: string;
  tarjeta_profesional: string;
  experiencia_anios?: number;
  id_especialidad: number;
  especialidad?: string;  
  id_consultorio: number;
  consultorio?: string;  
  estado?: 'ACTIVO' | 'INACTIVO';
  fecha_creacion?: string;
}

