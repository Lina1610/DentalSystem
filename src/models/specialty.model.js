"use strict";

const pool = require("../config/database");
const { buildWhere } = require("../helpers/buildWhere");
const { ValidationError } = require("../helpers/errors");

const Especialidad = {};

const SELECT_DETALLE = `
   SELECT
    id_especialidad,
    nombre,
    descripcion,
    estado,
    fecha_creacion,
    fecha_actualizacion
  FROM especialidad`;

Especialidad.findAll = async ({
  limite = 10,
  offset = 0,
  busqueda = "",
  estado = "",
} = {}) => {

  const { where, params } = buildWhere({
    filtros: {
      busqueda,
      exactos: {
        ...(estado ? { estado } : {}),
      },
    },
    searchableFields: ["nombre", "descripcion"],
  });

  const [[stats]] = await pool.query(
    `SELECT
        COUNT(*) AS total,
        COALESCE(SUM(estado = 'ACTIVO'), 0) AS activos,
        COALESCE(SUM(estado = 'INACTIVO'), 0) AS inactivos
     FROM especialidad
     ${where}`,
    params
  );

  const [data] = await pool.query(
    `${SELECT_DETALLE}
     ${where}
     ORDER BY id_especialidad ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limite), Number(offset)]
  );

  return {
    data,
    total: Number(stats.total),
    activos: Number(stats.activos),
    inactivos: Number(stats.inactivos),
  };
};