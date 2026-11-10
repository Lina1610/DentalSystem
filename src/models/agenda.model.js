'use strict';

const pool = require('../config/database');
const { buildWhere } = require('../helpers/buildWhere');

const Agenda = {};

const ESTADOS_VALIDOS = ['DISPONIBLE', 'OCUPADO', 'BLOQUEADO', 'NO_DISPONIBLE'];

Agenda.findAll = async ({
  limite = 10,
  offset = 0,
  busqueda = '',
  id_odontologo = '',
  fecha = '',
  estado = '',
} = {}) => {
  const filtrosBase = {
    ...(id_odontologo ? { 'agenda.id_odontologo': id_odontologo } : {}),
    ...(fecha ? { 'agenda.fecha': fecha } : {}),
  };

  const { where, params } = buildWhere({
    filtros: {
      busqueda,
      exactos: { ...filtrosBase, ...(estado ? { 'agenda.estado': estado } : {}) },
    },
    searchableFields: ['usr.nombres', 'usr.apellidos'],
  });

  // Los contadores ignoran el filtro de estado (reparto completo en las tarjetas)
  const { where: whereStats, params: paramsStats } = buildWhere({
    filtros: { busqueda, exactos: filtrosBase },
    searchableFields: ['usr.nombres', 'usr.apellidos'],
  });

  const [[stats]] = await pool.query(
    `SELECT
       COUNT(*)                             AS total,
       SUM(agenda.estado = 'DISPONIBLE')    AS disponibles,
       SUM(agenda.estado = 'OCUPADO')       AS ocupados,
       SUM(agenda.estado = 'BLOQUEADO')     AS bloqueados,
       SUM(agenda.estado = 'NO_DISPONIBLE') AS no_disponibles
     FROM agenda
     JOIN odontologo odo ON odo.id_odontologo = agenda.id_odontologo
     JOIN usuario    usr ON usr.id_usuario    = odo.id_usuario
     ${whereStats}`,
    paramsStats
  );

  const porEstado = {
    DISPONIBLE: stats.disponibles,
    OCUPADO: stats.ocupados,
    BLOQUEADO: stats.bloqueados,
    NO_DISPONIBLE: stats.no_disponibles,
  };

  const [data] = await pool.query(
    `SELECT
       agenda.*,
       CONCAT(usr.nombres, ' ', usr.apellidos) AS odontologo_nombre
     FROM agenda
     JOIN odontologo odo ON odo.id_odontologo = agenda.id_odontologo
     JOIN usuario    usr ON usr.id_usuario    = odo.id_usuario
     ${where}
     ORDER BY agenda.fecha ASC, agenda.hora_inicio ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limite), Number(offset)]
  );

  return {
    data,
    // total = registros que cumplen todos los filtros (para paginar)
    total:          Number(estado ? porEstado[estado] ?? 0 : stats.total),
    totalGeneral:   Number(stats.total),
    disponibles:   Number(stats.disponibles),
    ocupados:       Number(stats.ocupados),
    bloqueados:     Number(stats.bloqueados),
    no_disponibles: Number(stats.no_disponibles),
  };
};

// Horarios que se pueden agendar: DISPONIBLE y que todavía no han empezado
Agenda.findDisponibles = async ({ id_odontologo = '', fecha = '' } = {}) => {
  const condiciones = [
    `agenda.estado = 'DISPONIBLE'`,
    `TIMESTAMP(agenda.fecha, agenda.hora_inicio) >= NOW()`,
  ];
  const params = [];

  if (id_odontologo) {
    condiciones.push('agenda.id_odontologo = ?');
    params.push(id_odontologo);
  }
  if (fecha) {
    condiciones.push('agenda.fecha = ?');
    params.push(fecha);
  }

  const [rows] = await pool.query(
    `SELECT
       agenda.*,
       CONCAT(usr.nombres, ' ', usr.apellidos) AS odontologo_nombre
     FROM agenda
     JOIN odontologo odo ON odo.id_odontologo = agenda.id_odontologo
     JOIN usuario    usr ON usr.id_usuario    = odo.id_usuario
     WHERE ${condiciones.join(' AND ')}
     ORDER BY agenda.fecha ASC, agenda.hora_inicio ASC`,
    params
  );

  return rows;
};

Agenda.findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM agenda WHERE id_agenda = ?',
    [id]
  );
  return rows[0] ?? null;
};

// Lee el horario bloqueando la fila hasta el fin de la transacción, para que dos
// citas no puedan reservar el mismo bloque al mismo tiempo. Requiere una conexión en transacción.
// `cubre_rango` indica si [fechaInicio, fechaFin] cae dentro del bloque (fecha + horas).
// `ya_paso` indica si el horario ya empezó (según el reloj de MySQL).
Agenda.findByIdParaReservar = async (id, fechaInicio, fechaFin, conn) => {
  const [rows] = await conn.query(
    `SELECT
       agenda.*,
       (CAST(? AS DATETIME) >= TIMESTAMP(agenda.fecha, agenda.hora_inicio)
        AND CAST(? AS DATETIME) <= TIMESTAMP(agenda.fecha, agenda.hora_fin)) AS cubre_rango,
       (TIMESTAMP(agenda.fecha, agenda.hora_inicio) < NOW()) AS ya_paso
     FROM agenda
     WHERE id_agenda = ?
     FOR UPDATE`,
    [fechaInicio, fechaFin, id]
  );
  return rows[0] ?? null;
};

// true si fecha + hora ya pasaron según el reloj de MySQL (el mismo que usan citas y dashboard)
Agenda.yaPaso = async (fecha, hora) => {
  const [[row]] = await pool.query(
    'SELECT TIMESTAMP(DATE(?), ?) < NOW() AS ya_paso',
    [fecha, hora]
  );
  return Boolean(Number(row.ya_paso));
};

// Pasa a DISPONIBLE solo si estaba OCUPADO (no pisa un BLOQUEADO / NO_DISPONIBLE)
Agenda.liberar = async (id, db = pool) => {
  await db.query(
    `UPDATE agenda SET estado = 'DISPONIBLE' WHERE id_agenda = ? AND estado = 'OCUPADO'`,
    [id]
  );
};

Agenda.existeSolapamiento = async (idOdontologo, fecha, horaInicio, horaFin, excludeId = null) => {
  let query = `
    SELECT id_agenda
    FROM agenda
    WHERE id_odontologo = ?
      AND fecha = ?
      AND hora_inicio < ?
      AND hora_fin > ?
  `;
  const params = [idOdontologo, fecha, horaFin, horaInicio];

  if (excludeId != null) {
    query += ' AND id_agenda != ?';
    params.push(excludeId);
  }

  const [rows] = await pool.query(query, params);
  return rows.length > 0;
};

Agenda.create = async (data) => {
  const {
    id_odontologo,
    fecha,
    hora_inicio,
    hora_fin,
    estado = 'DISPONIBLE',
    observacion,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO agenda
       (id_odontologo, fecha, hora_inicio, hora_fin, estado, observacion)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id_odontologo, fecha, hora_inicio, hora_fin, estado, observacion ?? null]
  );

  return Agenda.findById(result.insertId);
};

Agenda.update = async (id, data) => {
  const CAMPOS_PERMITIDOS = [
    'id_odontologo', 'fecha', 'hora_inicio', 'hora_fin', 'estado', 'observacion',
  ];

  const campos  = [];
  const valores = [];

  for (const campo of CAMPOS_PERMITIDOS) {
    if (Object.prototype.hasOwnProperty.call(data, campo)) {
      campos.push(`${campo} = ?`);
      valores.push(data[campo] ?? null);
    }
  }

  if (campos.length === 0) {
    throw new Error('No hay campos válidos para actualizar');
  }

  valores.push(id);

  await pool.query(
    `UPDATE agenda SET ${campos.join(', ')} WHERE id_agenda = ?`,
    valores
  );

  return Agenda.findById(id);
};

Agenda.cambiarEstado = async (id, estado, db = pool) => {
  if (!ESTADOS_VALIDOS.includes(estado)) {
    throw new Error('Estado de agenda inválido');
  }

  await db.query(
    `UPDATE agenda SET estado = ? WHERE id_agenda = ?`,
    [estado, id]
  );

  const [rows] = await db.query('SELECT * FROM agenda WHERE id_agenda = ?', [id]);
  return rows[0] ?? null;
};

module.exports = Agenda;
