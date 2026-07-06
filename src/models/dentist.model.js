"use strict";

const pool = require("../config/database");
const { buildWhere } = require("../helpers/buildWhere");
const { ValidationError } = require("../helpers/errors");

const Dentista = {};

// Constante reutilizable para evitar duplicación de texto
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

  // COALESCE asegura que devuelva 0 en lugar de NULL si no hay filas
  const [[stats]] = await pool.query(
    `SELECT
       COUNT(*)                             AS total,
       COALESCE(SUM(o.estado = 'ACTIVO'), 0)   AS activos,
       COALESCE(SUM(o.estado = 'INACTIVO'), 0) AS inactivos
     FROM odontologo o
     ${JOINS}
     ${where}`,
    params,
  );

  const [data] = await pool.query(
    `${SELECT_DETALLE}
     ${where}
     ORDER BY o.id_odontologo ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limite), Number(offset)],
  );

  return {
    data,
    total: Number(stats.total),
    activos: Number(stats.activos),
    inactivos: Number(stats.inactivos),
  };
};

// Permite pasar una conexión específica (para transacciones) o usar el pool por defecto
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

Dentista.create = async (data) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [usuResult] = await conn.query(
      `INSERT INTO usuario
         (id_rol, nombres, apellidos, documento, telefono, email, username, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id_rol ?? 2,
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
    // Reutilizamos la misma conexión antes de liberarla
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
