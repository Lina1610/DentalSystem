// =========================================================
// MIDDLEWARE: roles.middleware.js
// Restringe el acceso según el rol del token (usar después de verificarToken)
// =========================================================
'use strict';

// Deben coincidir con los id de la tabla `rol`
const ROLES = Object.freeze({
  ADMIN: 1,
  ODONTOLOGO: 2,
  AUXILIAR: 3,
});

const soloRoles = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({ message: 'No tiene permisos para este recurso.' });
  }
  next();
};

module.exports = { soloRoles, ROLES };
