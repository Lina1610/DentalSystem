"use strict";

const pool = require("../config/database");
const { buildWhere } = require("../helpers/buildWhere");
const { ValidationError } = require("../helpers/errors");

const Dentista = {};

const SELECT_DETALLE = `
  SELECT
    o.id_odontologo, o.tarjeta_profesional, o.experiencia_anios, o.estado, o.fecha_creacion,
    u.id_usuario, u.nombres, u.apellidos, u.documento, u.email, u.telefono,
    e.nombre AS especialidad,
    c.nombre AS consultorio
  FROM odontologo o
    INNER JOIN usuario      u ON u.id_usuario     = o.id_usuario
    INNER JOIN especialidad e ON e.id_especialidad = o.id_especialidad
    INNER JOIN consultorio  c ON c.id_consultorio  = o.id_consultorio`;

Dentista.findAll = async ({
  limite = 10,
  offset = 0,
  busqueda = "",
  estado = "",
} = {}) => {
  const { where, params } = buildWhere({
    filtros: {
      busqueda,
      exactos: { ...(estado ? { 'o.estado': estado } : {}) },
    },
    searchableFields: ['u.nombres', 'u.apellidos', 'u.documento'],
  });

  const JOINS = `
    INNER JOIN usuario      u ON u.id_usuario     = o.id_usuario
    INNER JOIN especialidad e ON e.id_especialidad = o.id_especialidad
    INNER JOIN consultorio  c ON c.id_consultorio  = o.id_consultorio`;

  const { where: whereStats, params: paramsStats } = buildWhere({
    filtros: { busqueda },
    searchableFields: ['u.nombres', 'u.apellidos', 'u.documento'],
  });

  const [[stats]] = await pool.query(
    `SELECT
       COUNT(*)                             AS total,
       COALESCE(SUM(o.estado = 'ACTIVO'), 0)   AS activos,
       COALESCE(SUM(o.estado = 'INACTIVO'), 0) AS inactivos
     FROM odontologo o
     ${JOINS}
     ${whereStats}`,
    paramsStats,
  );

  const porEstado = { ACTIVO: stats.activos, INACTIVO: stats.inactivos };

  const [data] = await pool.query(
    `${SELECT_DETALLE}
     ${where}
     ORDER BY o.id_odontologo ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limite), Number(offset)],
  );

  return {
    data,
    total: Number(estado ? porEstado[estado] ?? 0 : stats.total),
    totalGeneral: Number(stats.total),
    activos: Number(stats.activos),
    inactivos: Number(stats.inactivos),
  };
};

Dentista.findById = async (id, connection = pool) => {
  const [rows] = await connection.query(
    `${SELECT_DETALLE} WHERE o.id_odontologo = ?`,
    [id]
  );
  return rows[0] ?? null;
};

Dentista.findByDocumento = async (documento) => {
  const [rows] = await pool.query(
    `${SELECT_DETALLE}
     WHERE u.documento = ? AND o.estado = 'ACTIVO'
     ORDER BY o.id_odontologo DESC
     LIMIT 1`,
    [documento]
  );
  return rows[0] ?? null;
};

Dentista.findByEmail = async (email) => {
  const [rows] = await pool.query(
    `${SELECT_DETALLE}
     WHERE u.email = ? AND o.estado = 'ACTIVO'
     LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
};

Dentista.existeDuplicado = async ({ documento, email, username, excludeIdOdontologo = null } = {}) => {
  const condiciones = [];
  const params = [];

  if (documento) { condiciones.push('u.documento = ?'); params.push(documento); }
  if (email)     { condiciones.push('u.email = ?');     params.push(email); }
  if (username)  { condiciones.push('u.username = ?');  params.push(username); }

  if (condiciones.length === 0) return false;

  let query = `
    SELECT u.id_usuario
    FROM usuario u
    LEFT JOIN odontologo o ON o.id_usuario = u.id_usuario
    WHERE (${condiciones.join(' OR ')})`;

  if (excludeIdOdontologo != null) {
    query += ' AND NOT (o.id_odontologo <=> ?)';
    params.push(excludeIdOdontologo);
  }

  const [rows] = await pool.query(`${query} LIMIT 1`, params);
  return rows.length > 0;
};

Dentista.create = async (data) => {
  if (!/^\$2[aby]\$\d{2}\$.{53}$/.test(data.password_hash ?? '')) {
    throw new Error('Dentista.create requiere password_hash con formato bcrypt');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [usuResult] = await conn.query(
      `INSERT INTO usuario
         (id_rol, nombres, apellidos, documento, telefono, email, username, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id_rol,
        data.nombres,
        data.apellidos,
        data.documento,
        data.telefono ?? null,
        data.email,
        data.username,
        data.password_hash,
      ]
    );

    const [odonResult] = await conn.query(
      `INSERT INTO odontologo
         (id_usuario, id_especialidad, id_consultorio, tarjeta_profesional, experiencia_anios)
       VALUES (?, ?, ?, ?, ?)`,
      [
        usuResult.insertId,
        data.id_especialidad,
        data.id_consultorio,
        data.tarjeta_profesional,
        data.experiencia_anios ?? 0,
      ]
    );

    await conn.commit();
    return await Dentista.findById(odonResult.insertId, conn);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

Dentista.update = async (id, data) => {
  const CAMPOS_USUARIO = [
    'nombres', 'apellidos', 'documento', 'telefono', 'email',
  ];
  const CAMPOS_ODONTOLOGO = [
    'id_especialidad', 'id_consultorio', 'tarjeta_profesional',
    'experiencia_anios', 'estado',
  ];

  const camposUsuario = [];
  const valoresUsuario = [];
  const camposOdontologo = [];
  const valoresOdontologo = [];

  for (const campo of CAMPOS_USUARIO) {
    if (Object.prototype.hasOwnProperty.call(data, campo)) {
      camposUsuario.push(`u.${campo} = ?`);
      valoresUsuario.push(data[campo] ?? null);
    }
  }

  for (const campo of CAMPOS_ODONTOLOGO) {
    if (Object.prototype.hasOwnProperty.call(data, campo)) {
      camposOdontologo.push(`${campo} = ?`);
      valoresOdontologo.push(data[campo] ?? null);
    }
  }

  if (camposUsuario.length === 0 && camposOdontologo.length === 0) {
    throw new ValidationError('No hay campos válidos para actualizar');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (camposUsuario.length > 0) {
      await conn.query(
        `UPDATE odontologo o
         INNER JOIN usuario u ON u.id_usuario = o.id_usuario
         SET ${camposUsuario.join(', ')}
         WHERE o.id_odontologo = ?`,
        [...valoresUsuario, id]
      );
    }

    if (camposOdontologo.length > 0) {
      await conn.query(
        `UPDATE odontologo
         SET ${camposOdontologo.join(', ')}
         WHERE id_odontologo = ?`,
        [...valoresOdontologo, id]
      );
    }

    await conn.commit();
    return await Dentista.findById(id, conn);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

Dentista.toggleEstado = async (id) => {
  await pool.query(
    `UPDATE odontologo
     SET estado = IF(estado = 'ACTIVO', 'INACTIVO', 'ACTIVO')
     WHERE id_odontologo = ?`,
    [id]
  );
  return Dentista.findById(id);
};

module.exports = Dentista;
