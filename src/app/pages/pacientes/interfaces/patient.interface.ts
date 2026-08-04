export interface Paciente {
  id_paciente?: number;
  nombres: string;
  apellidos: string;
  documento: string;
  fecha_nacimiento: string;
  genero: string;
  telefono: string;
  email?: string;
  direccion?: string;
  id_ciudad: number;
  alergias?: string;
  observaciones?: string;
  estado?: string;
}