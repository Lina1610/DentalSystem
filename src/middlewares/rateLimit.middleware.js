'use strict';

// =========================================================
// MIDDLEWARE: rateLimit.middleware.js
// Límite de intentos fallidos de login, en dos capas:
//   1. Por IP:     frena a un atacante que prueba muchas cuentas desde un equipo.
//   2. Por cuenta: frena a uno que ataca UNA cuenta desde muchas IPs.
// Solo cuentan los intentos fallidos (skipSuccessfulRequests): un usuario que
// entra bien no gasta su cupo.
//
// Almacenamiento en memoria: sirve con UNA instancia de la API. Si se escala a
// varias (PM2 cluster, varios contenedores), cambiar a un store compartido
// (rate-limit-redis) o cada instancia llevará su propio conteo.
// =========================================================

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const VENTANA_MS = 15 * 60 * 1000; // 15 minutos

const leerEntero = (nombre, porDefecto) => {
  const valor = Number.parseInt(process.env[nombre], 10);
  return Number.isInteger(valor) && valor > 0 ? valor : porDefecto;
};

const responderBloqueo = (req, res, next, options) => {
  const minutos = Math.ceil(options.windowMs / 60000);
  res.status(options.statusCode).json({
    message: `Demasiados intentos de inicio de sesión. Intenta de nuevo en ${minutos} minutos.`,
  });
};

const opcionesComunes = {
  windowMs: VENTANA_MS,
  standardHeaders: 'draft-8', // RateLimit / RateLimit-Policy; Retry-After en el 429
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: responderBloqueo,
};

const loginPorIp = rateLimit({
  ...opcionesComunes,
  limit: leerEntero('LOGIN_MAX_INTENTOS_IP', 20),
  // ipKeyGenerator agrupa IPv6 por subred /56: si no, rotar direcciones dentro
  // del mismo bloque daría intentos infinitos.
  keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip)}`,
});

// Correo normalizado igual que lo compara MySQL (collation *_ci: sin distinguir mayúsculas)
const claveDeCuenta = (req) => {
  const correo = req.body?.correo;
  if (typeof correo === 'string' && correo.trim() && correo.length <= 254) {
    return `cuenta:${correo.trim().toLowerCase()}`;
  }
  // Sin correo utilizable: se cuenta por IP para no dejar un hueco sin límite
  return `cuenta-sin-correo:${ipKeyGenerator(req.ip)}`;
};

// Más estricto que el de IP. Contrapartida conocida: alguien puede bloquear
// temporalmente el login de una cuenta ajena fallando a propósito; por eso la
// ventana es corta (15 min) y no hay bloqueo permanente.
const loginPorCuenta = rateLimit({
  ...opcionesComunes,
  limit: leerEntero('LOGIN_MAX_INTENTOS_CUENTA', 5),
  keyGenerator: claveDeCuenta,
});

module.exports = {
  limitarLogin: [loginPorIp, loginPorCuenta],
};
