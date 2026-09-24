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
  const { where, params } = buildWhere({
    filtros: {
      busqueda,
      exactos: {
        ...(id_odontologo ? { 'agenda.id_odontologo': id_odontologo } : {}),
        ...(fecha ? { 'agenda.fecha': fecha } : {}),
        ...(estado ? { 'agenda.estado': estado } : {}),
      },
    },
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
     ${where}`,
    params
  );

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
    total:          Number(stats.total),
    disponibles:    Number(stats.disponibles),
    ocupados:       Number(stats.ocupados),
    bloqueados:     Number(stats.bloqueados),
    no_disponibles: Number(stats.no_disponibles),
  };
};

Agenda.findDisponibles = async ({ id_odontologo = '', fecha = '' } = {}) => {
  const condiciones = [`agenda.estado = 'DISPONIBLE'`];
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

Agenda.cambiarEstado = async (id, estado) => {
  if (!ESTADOS_VALIDOS.includes(estado)) {
    throw new Error('Estado de agenda inválido');
  }

  await pool.query(
    `UPDATE agenda SET estado = ? WHERE id_agenda = ?`,
    [estado, id]
  );

  return Agenda.findById(id);
};

module.exports = Agenda;
