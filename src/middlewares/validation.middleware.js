const { validationResult } = require('express-validator');

const validar = (req, res, next) => {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    return res.status(422).json({
      message: 'Error de validación',
      errores: errores.array().map((e) => ({
        campo: e.path,
        mensaje: e.msg,
      })),
    });
  }

  next();
};

module.exports = validar;
