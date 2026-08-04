const { body, param } = require('express-validator');
const validar = require('../validation.middleware');

const guardsCrear = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres'),

  body('descripcion')
    .optional({ nullable: true })
    .trim(),

  body('precio')
    .notEmpty().withMessage('El precio es obligatorio')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0'),

  body('duracion_minutos')
    .notEmpty().withMessage('La duración es obligatoria')
    .isInt({ min: 1 }).withMessage('La duración debe ser un número entero mayor a 0'),

  body('estado')
    .optional()
    .isIn(['ACTIVO', 'INACTIVO'])
    .withMessage('Estado inválido'),

  validar,
];

const guardsActualizar = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de servicio inválido'),

  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres'),

  body('descripcion')
    .optional({ nullable: true })
    .trim(),

  body('precio')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0'),

  body('duracion_minutos')
    .optional()
    .isInt({ min: 1 }).withMessage('La duración debe ser un número entero mayor a 0'),

  body('estado')
    .optional()
    .isIn(['ACTIVO', 'INACTIVO'])
    .withMessage('Estado inválido'),

  validar,
];

const guardsId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),

  validar,
];

const guardsNombre = [
  param('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres'),

  validar,
];

module.exports = {
  guardsCrear,
  guardsActualizar,
  guardsId,
  guardsNombre,
};