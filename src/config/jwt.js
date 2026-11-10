'use strict';

// El secreto debe venir del entorno: sin él cualquiera podría firmar tokens válidos.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET no está definido en .env (mínimo 32 caracteres).');
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  JWT_ALGORITHM: 'HS256',
};
