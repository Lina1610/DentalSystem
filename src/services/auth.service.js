const User = require('../models/auth.model');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_ALGORITHM } = require('../config/jwt');
const { UnauthorizedError } = require('../helpers/errors');
const { hashPassword, verificarPassword, necesitaRehash, MAX_LONGITUD_ENTRADA } = require('../helpers/password');

// Un único mensaje para todo fallo: no revela si el correo existe ni si la cuenta está inactiva
const CREDENCIALES_INVALIDAS = 'Credenciales inválidas';

const entradaValida = (correo, password) =>
  typeof correo === 'string' && typeof password === 'string'
  && correo.trim() !== '' && password !== ''
  && correo.length <= 254 && password.length <= MAX_LONGITUD_ENTRADA;

// Sube el costo de un hash viejo aprovechando que se tiene la contraseña en claro.
// No bloquea ni hace fallar el login si algo sale mal.
const actualizarHashSiHaceFalta = async (user, password) => {
  if (!necesitaRehash(user.password_hash)) return;
  try {
    await User.actualizarHash(user.id_usuario, user.password_hash, await hashPassword(password));
  } catch (error) {
    console.error('[auth] No se pudo actualizar el hash del usuario', user.id_usuario, error.message);
  }
};

const loginUser = async ({ correo, password } = {}) => {
  if (!entradaValida(correo, password)) {
    // Igual se gasta un compare para no responder más rápido que en un fallo normal
    await verificarPassword(password, null);
    throw new UnauthorizedError(CREDENCIALES_INVALIDAS);
  }

  const user = await User.findByEmail(correo.trim());

  // Siempre se compara (contra un hash de relleno si no hay usuario) para que el tiempo sea parejo.
  // El estado se revisa DESPUÉS del compare por la misma razón.
  const passwordCorrecta = await verificarPassword(password, user?.password_hash);

  if (!user || !passwordCorrecta || user.estado !== 'ACTIVO') {
    throw new UnauthorizedError(CREDENCIALES_INVALIDAS);
  }

  await actualizarHashSiHaceFalta(user, password);
  User.registrarLogin(user.id_usuario).catch((error) =>
    console.error('[auth] No se pudo registrar ultimo_login', error.message)
  );

  const token = jwt.sign(
    {
      id: user.id_usuario,
      email: user.email,
      rol: user.id_rol,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, algorithm: JWT_ALGORITHM }
  );

  return {
    message: 'Login exitoso',
    token,
    rol: user.id_rol,
  };
};

module.exports = {
  loginUser,
};
