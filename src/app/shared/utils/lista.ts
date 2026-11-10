// Piezas compartidas por las pantallas de listado (Citas, Pacientes, Odontólogos, Servicios, Agenda).
// Los estilos correspondientes están en src/styles/components/_data-list.scss

export type ColorTarjeta = 'blue' | 'amber' | 'green' | 'violet' | 'red' | 'slate';

// Tarjeta de resumen: muestra un contador y al hacer clic filtra la tabla
export interface TarjetaResumen<F extends string> {
  filtro: F;
  label: string;
  color: ColorTarjeta;
  icono: string;
  valor: () => number;
}

// Trazos SVG (viewBox 24x24, estilo Lucide) para las tarjetas de resumen
export const ICONOS_LISTA = {
  calendario: 'M8 2v4M16 2v4M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18',
  reloj: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0M12 6v6l4 2',
  check: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0M8 12l3 3 5-6',
  finalizado: 'M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14l2 2 4-4',
  cancelado: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0M15 9l-6 6M9 9l6 6',
  bloqueado: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0M4.93 4.93l14.14 14.14',
  noDisponible: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0M8 12h8',
  usuarios: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  usuarioActivo: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0M16 11l2 2 4-4',
  usuarioInactivo: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0M17 8l5 5M22 8l-5 5',
  etiqueta: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
};

// Colores de avatar asignados de forma estable según el id
const COLORES_AVATAR = [
  { bg: '#f3e8ff', color: '#7c3aed' },
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#ffedd5', color: '#c2410c' },
  { bg: '#dcfce7', color: '#15803d' },
  { bg: '#ccfbf1', color: '#0f766e' },
  { bg: '#fce7f3', color: '#be185d' },
];

export function estiloAvatar(id: number): Record<string, string> {
  const c = COLORES_AVATAR[Math.abs(id - 1) % COLORES_AVATAR.length];
  return { 'background-color': c.bg, color: c.color };
}

export function inicialesDe(nombreCompleto?: string): string {
  if (!nombreCompleto) return '?';
  const partes = nombreCompleto.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

export function esHoy(fecha: string | Date): boolean {
  // 'YYYY-MM-DD' se interpreta como UTC; se fuerza la hora local para no correr el día
  const valor = typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? `${fecha}T00:00:00` : fecha;
  return new Date(valor).toDateString() === new Date().toDateString();
}
