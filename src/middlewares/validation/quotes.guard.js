const { body, param } = require('express-validator');
const validar = require('../validation.middleware');

const guardsCrear = [

  body('id_paciente')
    .notEmpty().withMessage('El paciente es obligatorio')
    .isInt({ min: 1 }).withMessage('ID de paciente inválido'),

  body('id_odontologo')
    .notEmpty().withMessage('El odontólogo es obligatorio')
    .isInt({ min: 1 }).withMessage('ID de odontólogo inválido'),

  body('id_servicio')
    .notEmpty().withMessage('El servicio es obligatorio')
    .isInt({ min: 1 }).withMessage('ID de servicio inválido'),

  body('id_agenda')
    .notEmpty().withMessage('La agenda es obligatoria')
    .isInt({ min: 1 }).withMessage('ID de agenda inválido'),

  body('fecha_inicio')
    .notEmpty().withMessage('La fecha de inicio es obligatoria')
    .isISO8601().withMessage('Fecha de inicio inválida'),

  body('fecha_fin')
    .notEmpty().withMessage('La fecha de fin es obligatoria')
    .isISO8601().withMessage('Fecha de fin inválida')
    .custom((value, { req }) => {

      const inicio = new Date(req.body.fecha_inicio);
      const fin = new Date(value);

      if (fin <= inicio) {
        throw new Error('La fecha de fin debe ser mayor que la fecha de inicio');
      }

      return true;
    }),

  body('motivo_consulta')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Máximo 255 caracteres'),

  body('estado')
    .optional()
    .isIn([
      'PENDIENTE',
      'CONFIRMADA',
      'CANCELADA',
      'FINALIZADA'
    ])
    .withMessage('Estado inválido'),

  body('observaciones')
    .optional({ nullable: true })
    .trim(),

  validar

];

const guardsActualizar = [

  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de cita inválido'),

  body('id_paciente')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de paciente inválido'),

  body('id_odontologo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de odontólogo inválido'),

  body('id_servicio')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de servicio inválido'),

  body('id_agenda')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de agenda inválido'),

  body('fecha_inicio')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),

  body('fecha_fin')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),

  body('estado')
    .optional()
    .isIn([
      'PENDIENTE',
      'CONFIRMADA',
      'CANCELADA',
      'FINALIZADA'
    ])
    .withMessage('Estado inválido'),

  validar

];
const guardsId = [

  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de cita inválido'),

  validar

];

module.exports = {
  guardsCrear,
  guardsActualizar,
  guardsId,
};