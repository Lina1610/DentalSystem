'use strict';

const pool = require('../config/database');
const { buildWhere } = require('../helpers/buildWhere');

const Cita = {};

Cita.findAll = async ({
  limite = 10,
  offset = 0,
  busqueda = '',
  estado = '',
  id_paciente = '',
  id_odontologo = '',
} = {}) => {
  const { where, params } = buildWhere({
    filtros: {
      busqueda,
      exactos: {
        ...(estado ? { 'cita.estado': estado } : {}),
        ...(id_paciente ? { 'cita.id_paciente': id_paciente } : {}),
        ...(id_odontologo ? { 'cita.id_odontologo': id_odontologo } : {}),
      },
    },
    searchableFields: ['pac.documento'],
  });

  const [[stats]] = await pool.query(
    `SELECT
       COUNT(*)                             AS total,
       SUM(cita.estado = 'PENDIENTE')       AS pendientes,
       SUM(cita.estado = 'CONFIRMADA')      AS confirmadas,
       SUM(cita.estado = 'CANCELADA')       AS canceladas,
       SUM(cita.estado = 'FINALIZADA')      AS finalizadas
     FROM cita
     JOIN paciente pac ON pac.id_paciente = cita.id_paciente
     ${where}`,
    params
  );

  const [data] = await pool.query(
    `SELECT
       cita.*,
       pac.documento                           AS paciente_documento,
       CONCAT(pac.nombres, ' ', pac.apellidos) AS paciente_nombre,
       CONCAT(usr.nombres, ' ', usr.apellidos) AS odontologo_nombre,
       srv.nombre                              AS servicio_nombre
     FROM cita
     JOIN paciente   pac ON pac.id_paciente   = cita.id_paciente
     JOIN odontologo odo ON odo.id_odontologo = cita.id_odontologo
     JOIN usuario    usr ON usr.id_usuario    = odo.id_usuario
     JOIN servicio   srv ON srv.id_servicio   = cita.id_servicio
     ${where}
     ORDER BY cita.id_cita ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limite), Number(offset)]
  );

  return {
    data,
    total: Number(stats.total),
    pendientes: Number(stats.pendientes),
    confirmadas: Number(stats.confirmadas),
    canceladas: Number(stats.canceladas),
    finalizadas: Number(stats.finalizadas),
  };
};

Cita.findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM cita WHERE id_cita = ?',
    [id]
  );
  return rows[0] ?? null;
};

Cita.findByPacienteId = async (idPaciente) => {
  const [rows] = await pool.query(
    `SELECT * FROM cita
     WHERE id_paciente = ?
     ORDER BY id_cita DESC
     LIMIT 1`,
    [idPaciente]
  );
  return rows[0] ?? null;
};

Cita.findByOdontologoId = async (idOdontologo) => {
  const [rows] = await pool.query(
    `SELECT * FROM cita
     WHERE id_odontologo = ?
     ORDER BY id_cita DESC
     LIMIT 1`,
    [idOdontologo]
  );
  return rows[0] ?? null;
};

Cita.existeConflictoHorario = async (
  idOdontologo,
  fechaInicio,
  fechaFin,
  excludeId = null
) => {
  let query = `
    SELECT id_cita
    FROM cita
    WHERE id_odontologo = ?
      AND estado IN ('PENDIENTE', 'CONFIRMADA')
      AND fecha_inicio < ?
      AND fecha_fin > ?
  `;

  const params = [idOdontologo, fechaFin, fechaInicio];

  if (excludeId != null) {
    query += ' AND id_cita != ?';
    params.push(excludeId);
  }

  const [rows] = await pool.query(query, params);
  return rows.length > 0;
};

Cita.create = async (data) => {
  const {
    id_paciente,
    id_odontologo,
    id_servicio,
    id_agenda,
    fecha_inicio,
    fecha_fin,
    motivo_consulta,
    estado = 'PENDIENTE',
    observaciones,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO cita
      (id_paciente, id_odontologo, id_servicio, id_agenda,
       fecha_inicio, fecha_fin, motivo_consulta, estado, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_paciente,
      id_odontologo,
      id_servicio,
      id_agenda,
      fecha_inicio,
      fecha_fin,
      motivo_consulta ?? null,
      estado,
      observaciones ?? null,
    ]
  );

  return Cita.findById(result.insertId);
};

Cita.update = async (id, data) => {
  const CAMPOS_PERMITIDOS = [
    'id_paciente',
    'id_odontologo',
    'id_servicio',
    'id_agenda',
    'fecha_inicio',
    'fecha_fin',
    'motivo_consulta',
    'estado',
    'observaciones',
  ];

  const campos = [];
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
    `UPDATE cita SET ${campos.join(', ')} WHERE id_cita = ?`,
    valores
  );

  return Cita.findById(id);
};

Cita.cancelar = async (id, observaciones = null) => {
  await pool.query(
    `UPDATE cita
     SET estado = 'CANCELADA', observaciones = COALESCE(?, observaciones)
     WHERE id_cita = ?`,
    [observaciones, id]
  );

  return Cita.findById(id);
};

Cita.cambiarEstado = async (id, estado) => {
  const estadosValidos = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA'];
  if (!estadosValidos.includes(estado)) {
    throw new Error('Estado de cita inválido');
  }

  await pool.query(
    `UPDATE cita SET estado = ? WHERE id_cita = ?`,
    [estado, id]
  );

  return Cita.findById(id);
};

module.exports = Cita;

