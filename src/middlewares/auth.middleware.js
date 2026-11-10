// =========================================================
// MIDDLEWARE: auth.middleware.js
// Verifica el JWT enviado en el header Authorization: Bearer <token>
// =========================================================
'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_ALGORITHM } = require('../config/jwt');

const verificarToken = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  try {
    // Fijar el algoritmo evita ataques de confusión de algoritmo (p. ej. "none").
    req.usuario = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError'
      ? 'Token expirado.'
      : 'Token inválido.';
    return res.status(401).json({ message });
  }
};

module.exports = { verificarToken };
