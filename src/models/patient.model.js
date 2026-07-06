'use strict';

const pool = require('../config/database');
const { buildWhere } = require('../helpers/buildWhere');

// ─────────────────────────────────────────────────────────────
// Modelo
// ─────────────────────────────────────────────────────────────

const Paciente = {};

// ---------------------------------------------------------
// Obtener todos los pacientes con paginación y filtros
// CORRECCIÓN: las estadísticas ahora respetan los mismos filtros
// que la consulta principal.
// ---------------------------------------------------------
Paciente.findAll = async ({
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
    searchableFields: ['nombres', 'apellidos', 'documento'],
  });

  // Estadísticas sobre el conjunto filtrado
  const [[stats]] = await pool.query(
    `SELECT
       COUNT(*)                  AS total,
       SUM(estado = 'ACTIVO')    AS activos,
       SUM(estado = 'INACTIVO')  AS inactivos
     FROM paciente
     ${where}`,
    params
  );

  // Datos paginados
  const [data] = await pool.query(
    `SELECT *
     FROM paciente
     ${where}
     ORDER BY id_paciente ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limite), Number(offset)]
  );

  return {
    data,
    total:    Number(stats.total),
    activos:  Number(stats.activos),
    inactivos: Number(stats.inactivos),
  };
};

// ---------------------------------------------------------
// Obtener paciente por ID
// ---------------------------------------------------------
Paciente.findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM paciente WHERE id_paciente = ?',
    [id]
  );
  return rows[0] ?? null;
};

// ---------------------------------------------------------
// Obtener paciente activo por documento
// ---------------------------------------------------------
Paciente.findByDocumento = async (documento) => {
  const [rows] = await pool.query(
    `SELECT * FROM paciente
     WHERE documento = ? AND estado = 'ACTIVO'
     ORDER BY id_paciente DESC
     LIMIT 1`,
    [documento]
  );
  return rows[0] ?? null;
};

// ---------------------------------------------------------
// Obtener paciente activo por email
// ---------------------------------------------------------
Paciente.findByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT * FROM paciente
     WHERE email = ? AND estado = 'ACTIVO'
     LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
};

// ---------------------------------------------------------
// Verificar duplicado de documento o email,
// excluyendo opcionalmente un ID (útil en actualizaciones).
// CORRECCIÓN: maneja email NULL correctamente sin comparar
// contra cadena vacía, evitando falsos negativos.
// ---------------------------------------------------------
Paciente.existeDuplicado = async (documento, email, excludeId = null) => {
  // Si email es null/undefined solo verificamos por documento
  const condicionEmail = email != null ? 'OR email = ?' : '';
  const paramsBase = email != null
    ? [documento, email]
    : [documento];

  let query = `
    SELECT id_paciente FROM paciente
    WHERE (documento = ? ${condicionEmail})
  `;

  if (excludeId != null) {
    query += ' AND id_paciente != ?';
    paramsBase.push(excludeId);
  }

  const [rows] = await pool.query(query, paramsBase);
  return rows.length > 0;
};

// ---------------------------------------------------------
// Crear paciente
// ---------------------------------------------------------
Paciente.create = async (data) => {
  const {
    nombres,
    apellidos,
    documento,
    fecha_nacimiento,
    genero,
    telefono,
    email,
    direccion,
    id_ciudad,
    alergias,
    observaciones,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO paciente
       (nombres, apellidos, documento, fecha_nacimiento, genero,
        telefono, email, direccion, id_ciudad, alergias, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nombres,
      apellidos,
      documento,
      fecha_nacimiento,
      genero,
      telefono,
      email       ?? null,
      direccion   ?? null,
      id_ciudad,
      alergias    ?? null,
      observaciones ?? null,
    ]
  );

  return Paciente.findById(result.insertId);
};

// ---------------------------------------------------------
// Actualizar paciente (solo los campos enviados)
// ---------------------------------------------------------
Paciente.update = async (id, data) => {
  const CAMPOS_PERMITIDOS = [
    'nombres', 'apellidos', 'documento', 'fecha_nacimiento',
    'genero', 'telefono', 'email', 'direccion',
    'id_ciudad', 'alergias', 'observaciones', 'estado',
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
    `UPDATE paciente SET ${campos.join(', ')} WHERE id_paciente = ?`,
    valores
  );

  return Paciente.findById(id);
};

// ---------------------------------------------------------
// Soft delete: cambia estado a INACTIVO
// ---------------------------------------------------------
Paciente.softDelete = async (id) => {
  const [result] = await pool.query(
    `UPDATE paciente SET estado = 'INACTIVO' WHERE id_paciente = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

// ---------------------------------------------------------
// Cambiar estado ACTIVO ↔ INACTIVO
// CORRECCIÓN: operación atómica en una sola query con CASE,
// elimina la race condition que existía con dos queries separadas.
// ---------------------------------------------------------
Paciente.toggleEstado = async (id) => {
  // Verificamos primero que el paciente exista
  const paciente = await Paciente.findById(id);
  if (!paciente) return null;

  await pool.query(
    `UPDATE paciente
     SET estado = CASE WHEN estado = 'ACTIVO' THEN 'INACTIVO' ELSE 'ACTIVO' END
     WHERE id_paciente = ?`,
    [id]
  );

  // Devolvemos el estado actualizado desde la base de datos
  return Paciente.findById(id);
};

module.exports = Paciente;