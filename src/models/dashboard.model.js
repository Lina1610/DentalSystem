'use strict';

const pool = require('../config/database');

// Consultas de solo lectura para el dashboard.
// `desde` y `hasta` son fechas 'YYYY-MM-DD' inclusivas: para columnas DATETIME/TIMESTAMP
// se filtra con `>= desde AND < hasta + 1 día`, así entra el día `hasta` completo.
// Los montos llegan como number gracias a `decimalNumbers` en config/database.js.

const Dashboard = {};

// ── Indicadores ─────────────────────────────────────────

// Citas de hoy (sin contar canceladas) y cuántas siguen sin confirmar
Dashboard.citasHoy = async () => {
  const [[row]] = await pool.query(
    `SELECT
       COUNT(*)                         AS total,
       COALESCE(SUM(estado = 'PENDIENTE'), 0) AS sin_confirmar
     FROM cita
     WHERE fecha_inicio >= CURDATE()
       AND fecha_inicio <  CURDATE() + INTERVAL 1 DAY
       AND estado <> 'CANCELADA'`
  );
  return { total: Number(row.total), sin_confirmar: Number(row.sin_confirmar) };
};

// Pacientes activos (en total) y pacientes registrados dentro del periodo
Dashboard.pacientes = async (desde, hasta) => {
  const [[row]] = await pool.query(
    `SELECT
       COALESCE(SUM(estado = 'ACTIVO'), 0) AS activos,
       COALESCE(SUM(fecha_registro >= ? AND fecha_registro < DATE_ADD(?, INTERVAL 1 DAY)), 0) AS nuevos
     FROM paciente`,
    [desde, hasta]
  );
  return { activos: Number(row.activos), nuevos: Number(row.nuevos) };
};

// Horarios que todavía se pueden agendar (DISPONIBLE y aún no empezados) y el más próximo.
// No depende del periodo: mira hacia adelante. Se usa en lugar de un % de ocupación porque
// cada cita ocupa un horario completo y los horarios se crean para ser agendados,
// así que ese porcentaje casi siempre da ~100% y no ayuda a decidir nada.
Dashboard.horariosLibres = async () => {
  const [[conteo]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM agenda
     WHERE estado = 'DISPONIBLE'
       AND TIMESTAMP(fecha, hora_inicio) >= NOW()`
  );

  const [[proximo]] = await pool.query(
    `SELECT
       agenda.id_agenda,
       DATE_FORMAT(agenda.fecha, '%Y-%m-%d')   AS fecha,
       agenda.hora_inicio,
       agenda.hora_fin,
       CONCAT(usr.nombres, ' ', usr.apellidos) AS odontologo
     FROM agenda
     JOIN odontologo odo ON odo.id_odontologo = agenda.id_odontologo
     JOIN usuario    usr ON usr.id_usuario    = odo.id_usuario
     WHERE agenda.estado = 'DISPONIBLE'
       AND TIMESTAMP(agenda.fecha, agenda.hora_inicio) >= NOW()
     ORDER BY agenda.fecha ASC, agenda.hora_inicio ASC
     LIMIT 1`
  );

  return { total: Number(conteo.total), proximo: proximo ?? null };
};

// Dinero cobrado en el periodo (solo pagos aprobados)
Dashboard.ingresos = async (desde, hasta) => {
  const [[row]] = await pool.query(
    `SELECT COALESCE(SUM(monto), 0) AS total
     FROM pago
     WHERE estado = 'APROBADO'
       AND fecha_pago >= ?
       AND fecha_pago <  DATE_ADD(?, INTERVAL 1 DAY)`,
    [desde, hasta]
  );
  return Number(row.total);
};

// Saldo pendiente: total de cada factura no anulada menos sus pagos aprobados.
// Se calcula con los pagos y no con factura.estado, porque ese estado puede estar
// desactualizado (p. ej. PAGADA con el pago RECHAZADO).
// No depende del periodo: es lo que se debe hoy. GREATEST evita negativos si se pagó de más.
Dashboard.porCobrar = async () => {
  const [[row]] = await pool.query(
    `SELECT COALESCE(SUM(GREATEST(f.total - COALESCE(p.pagado, 0), 0)), 0) AS total
     FROM factura f
     LEFT JOIN (
       SELECT id_factura, SUM(monto) AS pagado
       FROM pago
       WHERE estado = 'APROBADO'
       GROUP BY id_factura
     ) p ON p.id_factura = f.id_factura
     WHERE f.estado <> 'ANULADA'`
  );
  return Number(row.total);
};

// ── Listados y agrupaciones ─────────────────────────────

// Siguientes citas por atender (desde ahora), con los nombres para mostrar
Dashboard.proximasCitas = async (limite = 8) => {
  const [rows] = await pool.query(
    `SELECT
       cita.id_cita,
       cita.fecha_inicio,
       cita.fecha_fin,
       cita.estado,
       CONCAT(pac.nombres, ' ', pac.apellidos) AS paciente,
       CONCAT(usr.nombres, ' ', usr.apellidos) AS odontologo,
       srv.nombre                              AS servicio
     FROM cita
     JOIN paciente   pac ON pac.id_paciente   = cita.id_paciente
     JOIN odontologo odo ON odo.id_odontologo = cita.id_odontologo
     JOIN usuario    usr ON usr.id_usuario    = odo.id_usuario
     JOIN servicio   srv ON srv.id_servicio   = cita.id_servicio
     WHERE cita.fecha_inicio >= NOW()
       AND cita.estado IN ('PENDIENTE', 'CONFIRMADA')
     ORDER BY cita.fecha_inicio ASC
     LIMIT ?`,
    [Number(limite)]
  );
  return rows;
};

// Cantidad de citas por estado en el periodo (incluye canceladas: es justamente lo que se quiere ver)
Dashboard.citasPorEstado = async (desde, hasta) => {
  const [rows] = await pool.query(
    `SELECT estado, COUNT(*) AS total
     FROM cita
     WHERE fecha_inicio >= ?
       AND fecha_inicio <  DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY estado`,
    [desde, hasta]
  );
  return rows.map(r => ({ estado: r.estado, total: Number(r.total) }));
};

// Citas atendidas o por atender por odontólogo en el periodo (sin canceladas)
Dashboard.citasPorOdontologo = async (desde, hasta) => {
  const [rows] = await pool.query(
    `SELECT
       odo.id_odontologo,
       CONCAT(usr.nombres, ' ', usr.apellidos) AS odontologo,
       COUNT(*)                                AS total
     FROM cita
     JOIN odontologo odo ON odo.id_odontologo = cita.id_odontologo
     JOIN usuario    usr ON usr.id_usuario    = odo.id_usuario
     WHERE cita.fecha_inicio >= ?
       AND cita.fecha_inicio <  DATE_ADD(?, INTERVAL 1 DAY)
       AND cita.estado <> 'CANCELADA'
     GROUP BY odo.id_odontologo, usr.nombres, usr.apellidos
     ORDER BY total DESC, odontologo ASC`,
    [desde, hasta]
  );
  return rows.map(r => ({ ...r, total: Number(r.total) }));
};

// Servicios más solicitados en el periodo (sin canceladas)
Dashboard.serviciosTop = async (desde, hasta, limite = 5) => {
  const [rows] = await pool.query(
    `SELECT
       srv.id_servicio,
       srv.nombre AS servicio,
       COUNT(*)   AS total
     FROM cita
     JOIN servicio srv ON srv.id_servicio = cita.id_servicio
     WHERE cita.fecha_inicio >= ?
       AND cita.fecha_inicio <  DATE_ADD(?, INTERVAL 1 DAY)
       AND cita.estado <> 'CANCELADA'
     GROUP BY srv.id_servicio, srv.nombre
     ORDER BY total DESC, servicio ASC
     LIMIT ?`,
    [desde, hasta, Number(limite)]
  );
  return rows.map(r => ({ ...r, total: Number(r.total) }));
};

// Pagos aprobados agrupados por mes ('YYYY-MM') desde `desdeMes` (primer día de un mes).
// Solo devuelve los meses con pagos; el servicio rellena los meses vacíos con 0.
Dashboard.ingresosMensuales = async (desdeMes) => {
  const [rows] = await pool.query(
    `SELECT
       DATE_FORMAT(fecha_pago, '%Y-%m') AS mes,
       SUM(monto)                       AS total
     FROM pago
     WHERE estado = 'APROBADO'
       AND fecha_pago >= ?
     GROUP BY mes
     ORDER BY mes ASC`,
    [desdeMes]
  );
  return rows.map(r => ({ mes: r.mes, total: Number(r.total) }));
};

module.exports = Dashboard;
