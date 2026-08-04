'use strict';

const pool = require('../config/database');
const { buildWhere } = require('../helpers/buildWhere');

const Service = {};

Service.findAll = async ({
  limite = 10,
  offset = 0,
  busqueda = '',
  estado = '',
} = {}) => {
  const { where, params } = buildWhere({
    filtros: {
      busqueda,
      exactos: { ...(estado ? { estado } : {}) },
    },
    searchableFields: ['nombre'],
  });

  const [[stats]] = await pool.query(
    `SELECT
       COUNT(*)                  AS total,
       SUM(estado = 'ACTIVO')    AS activos,
       SUM(estado = 'INACTIVO')  AS inactivos
     FROM servicio
     ${where}`,
    params
  );

  // Datos paginados
  const [data] = await pool.query(
    `SELECT *
     FROM servicio
     ${where}
     ORDER BY id_servicio ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limite), Number(offset)]
  );

  return {
    data,
    total:    Number(stats.total),
    activos:  Number(stats.activos),
    inactivos: Number(stats.inactivos),
  };
}

Service.findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM servicio WHERE id_servicio = ?',
    [id]
  );
  return rows[0] ?? null;
};

Service.findByNombre = async (nombre) => {
  const [rows] = await pool.query(
    `SELECT * FROM servicio
     WHERE nombre = ? AND estado = 'ACTIVO'
     ORDER BY id_servicio DESC
     LIMIT 1`,
    [nombre]
  );
  return rows[0] ?? null;
};

Service.existeDuplicado = async (nombre, excludeId = null) => {
  let query = `
    SELECT id_servicio FROM servicio
    WHERE nombre = ?
  `;
  const params = [nombre];

  if (excludeId != null) {
    query += ' AND id_servicio != ?';
    params.push(excludeId);
  }

  const [rows] = await pool.query(query, params);
  return rows.length > 0;
};

Service.create = async (data) => {
  const {
    nombre,
    descripcion,
    precio,
    duracion_minutos,
    estado,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO servicio
       (nombre, descripcion, precio, duracion_minutos, estado)
     VALUES (?, ?, ?, ?, ?)`,
    [
      nombre,
      descripcion ?? null,
      precio ?? 0,
      duracion_minutos ?? 0,
      estado ?? 'ACTIVO',
    ]
  );

  return Service.findById(result.insertId);
};

Service.update = async (id, data) => {
  const CAMPOS_PERMITIDOS = [
    'nombre', 'descripcion', 'precio', 'duracion_minutos', 'estado',
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
    `UPDATE servicio SET ${campos.join(', ')} WHERE id_servicio = ?`,
    valores
  );

  return Service.findById(id);
};

Service.softDelete = async (id) => {
  const [result] = await pool.query(
    `UPDATE servicio SET estado = 'INACTIVO' WHERE id_servicio = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

Service.toggleEstado = async (id) => {
  // Verificamos primero que el servicio exista
  const servicio = await Service.findById(id);
  if (!servicio) return null;

  await pool.query(
    `UPDATE servicio
     SET estado = CASE WHEN estado = 'ACTIVO' THEN 'INACTIVO' ELSE 'ACTIVO' END
     WHERE id_servicio = ?`,
    [id]
  );

  // Devolvemos el estado actualizado desde la base de datos
  return Service.findById(id);
};

module.exports = Service;