const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {

    const result = await authService.loginUser(req.body);

    res.json(result);

  } catch (error) {

    // Credenciales inválidas → 401; errores internos (BD, etc.) → manejador global
    // para no exponer su mensaje como si fuera un fallo de login.
    next(error);

  }
};

module.exports = {
  login
};
