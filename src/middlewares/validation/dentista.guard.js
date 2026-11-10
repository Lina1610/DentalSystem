
'use strict';

const { body, param } = require('express-validator');
const validar = require('../validation.middleware');
const { problemasDePolitica } = require('../../helpers/password');

const guardsCrear = [
  // ── Datos personales (tabla usuario) ──────────────────
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

  body('telefono')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Máximo 20 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email inválido')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres'),

  body('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es obligatorio')
    .isLength({ min: 3, max: 50 }).withMessage('Entre 3 y 50 caracteres'),

  // Sin .trim(): la contraseña se guarda exactamente como se escribió.
  // El cliente envía la contraseña en claro (por HTTPS); el hash lo genera SOLO el servidor.
  body('password')
    .custom((password, { req }) => {
      const problemas = problemasDePolitica(password, req.body);
      if (problemas.length > 0) throw new Error(problemas.join('. '));
      return true;
    }),

  // Rechazo explícito del nombre viejo: si un cliente desactualizado lo envía,
  // que falle claro en vez de crear un usuario sin contraseña utilizable.
  body('password_hash')
    .not().exists().withMessage('Campo no permitido: envía la contraseña en "password"'),

  body('tarjeta_profesional')
    .trim()
    .notEmpty().withMessage('La tarjeta profesional es obligatoria')
    .isLength({ max: 50 }).withMessage('Máximo 50 caracteres'),

  body('experiencia_anios')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 60 }).withMessage('Experiencia inválida (0-60 años)'),

  body('id_especialidad')
    .notEmpty().withMessage('La especialidad es obligatoria')
    .isInt({ min: 1 }).withMessage('ID de especialidad inválido'),

  body('id_consultorio')
    .notEmpty().withMessage('El consultorio es obligatorio')
    .isInt({ min: 1 }).withMessage('ID de consultorio inválido'),

  // El rol lo fija el servidor (ODONTOLOGO). Aceptarlo del cliente permitiría
  // crear administradores por esta ruta.
  body('id_rol')
    .not().exists().withMessage('El rol no se puede asignar desde este formulario'),

  validar,
];

const guardsActualizar = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de odontólogo inválido'),

  // ── Datos personales ───────────────────────────────────
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

  body('telefono')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Máximo 20 caracteres'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email inválido')
    .isLength({ max: 120 }).withMessage('Máximo 120 caracteres'),

  // ── Datos profesionales ────────────────────────────────
  body('tarjeta_profesional')
    .optional()
    .trim()
    .notEmpty().withMessage('La tarjeta profesional no puede estar vacía')
    .isLength({ max: 50 }).withMessage('Máximo 50 caracteres'),

  body('experiencia_anios')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 60 }).withMessage('Experiencia inválida (0-60 años)'),

  body('id_especialidad')
    .optional()
    .isInt({ min: 1 }).withMessage('ID de especialidad inválido'),

  body('id_consultorio')
    .optional()
    .isInt({ min: 1 }).withMessage('ID de consultorio inválido'),

  body('estado')
    .optional()
    .isIn(['ACTIVO', 'INACTIVO']).withMessage('Estado inválido'),

  body().custom((_, { req }) => {
    const CAMPOS_PERMITIDOS = [
      'nombres',
      'apellidos',
      'documento',
      'telefono',
      'email',
      'tarjeta_profesional',
      'experiencia_anios',
      'id_especialidad',
      'id_consultorio',
      'estado',
    ];

    const tieneAlMenosUnCampoValido = CAMPOS_PERMITIDOS.some((campo) =>
      Object.prototype.hasOwnProperty.call(req.body ?? {}, campo)
    );

    if (!tieneAlMenosUnCampoValido) {
      throw new Error('Debe enviar al menos un campo válido para actualizar');
    }

    return true;
  }),

  validar,
];

const guardsId = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo'),
  validar,
];


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
