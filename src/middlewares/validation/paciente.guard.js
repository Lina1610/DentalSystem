// =========================================================
// GUARDS: paciente.guard.js
// Validaciones con express-validator
// =========================================================

const { body, param } = require('express-validator');
const validar = require('../validation.middleware');

// ---------------------------------------------------------
// Guard: Crear paciente
// POST /pacientes
// ---------------------------------------------------------
const guardsCrear = [
  body('nombres')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),

  body('apellidos')
    .trim()
    .notEmpty().withMessage('Los apellidos son obligatorios')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),

  body('documento')
    .trim()
    .notEmpty().withMessage('El documento es obligatorio')
    .isLength({ max: 20 }).withMessage('Máximo 20 caracteres'),

  body('fecha_nacimiento')
    .notEmpty().withMessage('La fecha de nacimiento es obligatoria')
    .isDate().withMessage('Formato de fecha inválido (YYYY-MM-DD)')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      if (fecha >= hoy) {
        throw new Error('La fecha de nacimiento debe ser anterior a hoy');
      }
      return true;
    }),

  body('genero')
    .notEmpty().withMessage('El género es obligatorio')
    .isIn(['MASCULINO', 'FEMENINO', 'OTRO'])
    .withMessage('Género inválido. Use: MASCULINO, FEMENINO u OTRO'),

  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es obligatorio')
    .isLength({ max: 20 }).withMessage('Máximo 20 caracteres'),

  body('email')
    .optional({ nullable: true })
    .trim()
    .isEmail().withMessage('Email inválido')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres'),

  body('direccion')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Máximo 200 caracteres'),

  body('id_ciudad')
    .notEmpty().withMessage('La ciudad es obligatoria')
    .isInt({ min: 1 }).withMessage('ID de ciudad inválido'),

  body('alergias')
    .optional({ nullable: true })
    .trim(),

  body('observaciones')
    .optional({ nullable: true })
    .trim(),

  validar,
];

// ---------------------------------------------------------
// Guard: Actualizar paciente
// PUT /pacientes/:id
// ---------------------------------------------------------
const guardsActualizar = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de paciente inválido'),

  body('nombres')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),

  body('apellidos')
    .optional()
    .trim()
    .notEmpty().withMessage('Los apellidos no pueden estar vacíos')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),

  body('documento')
    .optional()
    .trim()
    .notEmpty().withMessage('El documento no puede estar vacío')
    .isLength({ max: 20 }).withMessage('Máximo 20 caracteres'),

  body('fecha_nacimiento')
    .optional()
    .isDate().withMessage('Formato de fecha inválido (YYYY-MM-DD)')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      if (fecha >= hoy) {
        throw new Error('La fecha de nacimiento debe ser anterior a hoy');
      }
      return true;
    }),

  body('genero')
    .optional()
    .isIn(['MASCULINO', 'FEMENINO', 'OTRO'])
    .withMessage('Género inválido'),

  body('telefono')
    .optional()
    .trim()
    .notEmpty().withMessage('El teléfono no puede estar vacío')
    .isLength({ max: 20 }).withMessage('Máximo 20 caracteres'),

  body('email')
    .optional({ nullable: true })
    .trim()
    .isEmail().withMessage('Email inválido')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres'),

  body('id_ciudad')
    .optional()
    .isInt({ min: 1 }).withMessage('ID de ciudad inválido'),

  body('estado')
    .optional()
    .isIn(['ACTIVO', 'INACTIVO']).withMessage('Estado inválido'),

  validar,
];

// ---------------------------------------------------------
// Guard: Validar ID en parámetro
// GET /pacientes/:id  |  DELETE /pacientes/:id
// ---------------------------------------------------------
const guardsId = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo'),
  validar,
];

// ---------------------------------------------------------
// Guard: Buscar por documento
// GET /pacientes/documento/:documento
// ---------------------------------------------------------
const guardsDocumento = [
  param('documento')
    .trim()
    .notEmpty().withMessage('El documento es obligatorio')
    .isLength({ max: 20 }).withMessage('Máximo 20 caracteres'),
  validar,
];

module.exports = {
  guardsCrear,
  guardsActualizar,
  guardsId,
  guardsDocumento,
};
