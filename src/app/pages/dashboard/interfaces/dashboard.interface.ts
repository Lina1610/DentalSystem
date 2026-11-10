// Forma exacta de la respuesta de GET /api/dashboard (ver api/src/services/dashboard.service.js)

export type PeriodoDashboard = 'hoy' | 'semana' | 'mes' | '30dias';

export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'FINALIZADA' | 'CANCELADA';

export interface PeriodoResuelto {
  tipo: PeriodoDashboard | 'personalizado';
  desde: string;   // 'YYYY-MM-DD'
  hasta: string;   // 'YYYY-MM-DD'
}

export interface HorarioLibre {
  id_agenda: number;
  fecha: string;        // 'YYYY-MM-DD'
  hora_inicio: string;  // 'HH:MM:SS'
  hora_fin: string;
  odontologo: string;
}

export interface HorariosLibres {
  total: number;
  proximo: HorarioLibre | null;
}

export interface KpisDashboard {
  citas_hoy: number;
  citas_hoy_sin_confirmar: number;
  pacientes_activos: number;
  pacientes_nuevos: number;
  horarios_libres: HorariosLibres;
  ingresos: number;
  por_cobrar: number;
}

export interface ProximaCita {
  id_cita: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoCita;
  paciente: string;
  odontologo: string;
  servicio: string;
}

export interface CitasOdontologo {
  id_odontologo: number;
  odontologo: string;
  total: number;
}

export interface ServicioTop {
  id_servicio: number;
  servicio: string;
  total: number;
}

export interface IngresoMensual {
  mes: string;     // 'YYYY-MM'
  total: number;
}

export interface ResumenDashboard {
  periodo: PeriodoResuelto;
  kpis: KpisDashboard;
  proximas_citas: ProximaCita[];
  citas_por_estado: Record<EstadoCita, number>;
  citas_por_odontologo: CitasOdontologo[];
  servicios_top: ServicioTop[];
  ingresos_mensuales: IngresoMensual[];
}
