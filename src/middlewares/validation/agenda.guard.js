const { body, param } = require('express-validator');
const validar = require('../validation.middleware');

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

const guardsCrear = [

  body('id_odontologo')
    .notEmpty().withMessage('El odontólogo es obligatorio')
    .isInt({ min: 1 }).withMessage('ID de odontólogo inválido'),

  body('fecha')
    .notEmpty().withMessage('La fecha es obligatoria')
    .isISO8601().withMessage('Fecha inválida'),

  body('hora_inicio')
    .notEmpty().withMessage('La hora de inicio es obligatoria')
    .matches(HORA_REGEX).withMessage('Hora de inicio inválida (HH:mm)'),

  body('hora_fin')
    .notEmpty().withMessage('La hora de fin es obligatoria')
    .matches(HORA_REGEX).withMessage('Hora de fin inválida (HH:mm)')
    .custom((value, { req }) => {
      if (req.body.hora_inicio && value <= req.body.hora_inicio) {
        throw new Error('La hora de fin debe ser mayor que la hora de inicio');
      }
      return true;
    }),

  body('estado')
    .optional()
    .isIn(['DISPONIBLE', 'OCUPADO', 'BLOQUEADO', 'NO_DISPONIBLE'])
    .withMessage('Estado inválido'),

  body('observacion')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Máximo 255 caracteres'),

  validar,

];

const guardsActualizar = [

  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de agenda inválido'),

  body('id_odontologo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de odontólogo inválido'),

  body('fecha')
    .optional()
    .isISO8601()
    .withMessage('Fecha inválida'),

  body('hora_inicio')
    .optional()
    .matches(HORA_REGEX)
    .withMessage('Hora de inicio inválida (HH:mm)'),

  body('hora_fin')
    .optional()
    .matches(HORA_REGEX)
    .withMessage('Hora de fin inválida (HH:mm)'),

  body('estado')
    .optional()
    .isIn(['DISPONIBLE', 'OCUPADO', 'BLOQUEADO', 'NO_DISPONIBLE'])
    .withMessage('Estado inválido'),

  body('observacion')
    .optional({ nullable: true })
    .trim(),

  validar,

];

const guardsId = [

  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de agenda inválido'),

  validar,

];

module.exports = {
  guardsCrear,
  guardsActualizar,
  guardsId,
};
