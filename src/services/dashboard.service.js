'use strict';

const Dashboard = require('../models/dashboard.model');
const { ValidationError } = require('../helpers/errors');

const PERIODOS = ['hoy', 'semana', 'mes', '30dias'];
const PERIODO_DEFAULT = 'mes';
const ESTADOS_CITA = ['PENDIENTE', 'CONFIRMADA', 'FINALIZADA', 'CANCELADA'];
const MESES_INGRESOS = 6;
const MAX_DIAS_RANGO = 366;
const LIMITE_PROXIMAS = 8;
const LIMITE_SERVICIOS = 5;

// ── Fechas ──────────────────────────────────────────────
// Se trabaja con fechas locales del servidor ('YYYY-MM-DD'), igual que CURDATE() en MySQL.

const aISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const sumarDias = (d, dias) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias);

// Convierte 'YYYY-MM-DD' en Date local, o null si el formato o la fecha no son válidos (p. ej. 2026-02-30)
const parsearFecha = (texto) => {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  const [y, m, d] = texto.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.getFullYear() === y && fecha.getMonth() === m - 1 && fecha.getDate() === d ? fecha : null;
};

// Devuelve { tipo, desde, hasta } a partir de un rango explícito o de un periodo predefinido
const resolverPeriodo = ({ periodo, desde, hasta } = {}, hoy = new Date()) => {
  if (desde || hasta) {
    const inicio = parsearFecha(desde);
    const fin    = parsearFecha(hasta);
    if (!inicio || !fin) {
      throw new ValidationError('Las fechas "desde" y "hasta" son obligatorias juntas y deben tener formato YYYY-MM-DD');
    }
    if (inicio > fin) {
      throw new ValidationError('La fecha "desde" no puede ser posterior a "hasta"');
    }
    const dias = Math.round((fin - inicio) / 86400000) + 1;
    if (dias > MAX_DIAS_RANGO) {
      throw new ValidationError(`El rango no puede superar ${MAX_DIAS_RANGO} días`);
    }
    return { tipo: 'personalizado', desde, hasta };
  }

  const tipo = periodo || PERIODO_DEFAULT;
  if (!PERIODOS.includes(tipo)) {
    throw new ValidationError(`Periodo inválido. Valores permitidos: ${PERIODOS.join(', ')}`);
  }

  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  switch (tipo) {
    case 'hoy':
      return { tipo, desde: aISO(base), hasta: aISO(base) };
    case 'semana': {
      // Semana de lunes a domingo (getDay: 0 = domingo)
      const lunes = sumarDias(base, -((base.getDay() + 6) % 7));
      return { tipo, desde: aISO(lunes), hasta: aISO(sumarDias(lunes, 6)) };
    }
    case '30dias':
      return { tipo, desde: aISO(sumarDias(base, -29)), hasta: aISO(base) };
    case 'mes':
    default:
      return {
        tipo,
        desde: aISO(new Date(base.getFullYear(), base.getMonth(), 1)),
        hasta: aISO(new Date(base.getFullYear(), base.getMonth() + 1, 0)),
      };
  }
};

// Últimos N meses terminando en el actual, como 'YYYY-MM', del más antiguo al más reciente
const ultimosMeses = (n, hoy = new Date()) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

// ── Resumen ─────────────────────────────────────────────

const obtenerResumen = async (opciones = {}) => {
  const hoy = new Date();
  const periodo = resolverPeriodo(opciones, hoy);
  const { desde, hasta } = periodo;
  const meses = ultimosMeses(MESES_INGRESOS, hoy);

  // Consultas independientes: en paralelo, la respuesta tarda lo que la más lenta
  const [
    citasHoy,
    pacientes,
    horariosLibres,
    ingresos,
    porCobrar,
    proximasCitas,
    citasPorEstado,
    citasPorOdontologo,
    serviciosTop,
    ingresosPorMes,
  ] = await Promise.all([
    Dashboard.citasHoy(),
    Dashboard.pacientes(desde, hasta),
    Dashboard.horariosLibres(),
    Dashboard.ingresos(desde, hasta),
    Dashboard.porCobrar(),
    Dashboard.proximasCitas(LIMITE_PROXIMAS),
    Dashboard.citasPorEstado(desde, hasta),
    Dashboard.citasPorOdontologo(desde, hasta),
    Dashboard.serviciosTop(desde, hasta, LIMITE_SERVICIOS),
    Dashboard.ingresosMensuales(`${meses[0]}-01`),
  ]);

  // Todos los estados presentes (en 0 si no hay citas), para que el frontend no tenga que completarlos
  const porEstado = Object.fromEntries(ESTADOS_CITA.map(e => [e, 0]));
  for (const { estado, total } of citasPorEstado) porEstado[estado] = total;

  // Los 6 meses siempre presentes, en 0 los que no tuvieron pagos
  const totalPorMes = new Map(ingresosPorMes.map(r => [r.mes, r.total]));

  return {
    periodo,
    kpis: {
      citas_hoy:               citasHoy.total,
      citas_hoy_sin_confirmar: citasHoy.sin_confirmar,
      pacientes_activos:       pacientes.activos,
      pacientes_nuevos:        pacientes.nuevos,
      horarios_libres:         horariosLibres,
      ingresos,
      por_cobrar:              porCobrar,
    },
    proximas_citas:       proximasCitas,
    citas_por_estado:     porEstado,
    citas_por_odontologo: citasPorOdontologo,
    servicios_top:        serviciosTop,
    ingresos_mensuales:   meses.map(mes => ({ mes, total: totalPorMes.get(mes) ?? 0 })),
  };
};

module.exports = {
  obtenerResumen,
  // Exportados para pruebas
  resolverPeriodo,
  ultimosMeses,
  PERIODOS,
};
