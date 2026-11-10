const { query } = require('express-validator');
const validar = require('../validation.middleware');
const { PERIODOS } = require('../../services/dashboard.service');

const guardsResumen = [

  query('periodo')
    .optional()
    .trim()
    .isIn(PERIODOS)
    .withMessage(`Periodo inválido. Valores permitidos: ${PERIODOS.join(', ')}`),

  query('desde')
    .optional()
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('La fecha "desde" debe tener formato YYYY-MM-DD')
    .custom((value, { req }) => {
      if (!req.query.hasta) {
        throw new Error('Si envías "desde" también debes enviar "hasta"');
      }
      return true;
    }),

  query('hasta')
    .optional()
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('La fecha "hasta" debe tener formato YYYY-MM-DD')
    .custom((value, { req }) => {
      if (!req.query.desde) {
        throw new Error('Si envías "hasta" también debes enviar "desde"');
      }
      return true;
    }),

  validar,

];

module.exports = {
  guardsResumen,
};
