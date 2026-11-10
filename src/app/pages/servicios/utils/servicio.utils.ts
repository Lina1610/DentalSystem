import { Servicio } from '../interfaces/servicio.interface';
import { formatearMoneda } from '../../../shared/utils/formato';

// Campos editables de un servicio (los que muestran los modales)
export interface ServicioForm {
  nombre: string;
  descripcion: string;
  precio: number | null;
  duracion_minutos: number | null;
}

export const servicioFormVacio = (): ServicioForm => ({
  nombre:           '',
  descripcion:      '',
  precio:           null,
  duracion_minutos: null,
});

// Mismas reglas que service.guard.js del backend; devuelve el mensaje de error o '' si es válido
export function validarServicio(form: ServicioForm): string {
  if (!form.nombre.trim()) {
    return 'El nombre es obligatorio';
  }
  if (form.nombre.trim().length > 120) {
    return 'El nombre admite máximo 120 caracteres';
  }
  if (form.precio === null || !Number.isFinite(form.precio) || form.precio < 0) {
    return 'El precio debe ser un número mayor o igual a 0';
  }
  if (form.duracion_minutos === null || !Number.isInteger(form.duracion_minutos) || form.duracion_minutos < 1) {
    return 'La duración debe ser un número entero de minutos mayor a 0';
  }
  return '';
}

// Normaliza el formulario al cuerpo que espera la API
export function aServicio(form: ServicioForm): Servicio {
  return {
    nombre:           form.nombre.trim(),
    descripcion:      form.descripcion.trim() || undefined,
    precio:           form.precio!,
    duracion_minutos: form.duracion_minutos!,
  };
}

// 100000 → "$ 100.000"
export const formatearPrecio = formatearMoneda;

// 30 → "30 min", 90 → "1 h 30 min", 120 → "2 h"
export function formatearDuracion(minutos: number | null | undefined): string {
  if (!minutos) return '—';
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}
