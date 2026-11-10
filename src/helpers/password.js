'use strict';

// =========================================================
// HELPER: password.js
// Único lugar donde se hashean, verifican y validan contraseñas.
// Ningún otro módulo debe llamar a bcrypt directamente.
// =========================================================

// bcrypt nativo: el hash corre en el threadpool de libuv y no bloquea el event loop
// (bcryptjs, en JS puro, ocupa ~0.5 s de CPU del hilo principal por cada login).
const bcrypt = require('bcrypt');

// Costo de bcrypt. 12 ≈ 0.25–0.5 s por hash según la máquina: lento para
// fuerza bruta offline y aceptable para un login. Subirlo con el tiempo:
// los hashes viejos se actualizan solos al iniciar sesión (ver necesitaRehash).
const BCRYPT_ROUNDS = 12;

// bcrypt solo usa los primeros 72 BYTES; lo que sigue se ignora en silencio.
// Se rechaza en vez de truncar, para que la contraseña real sea la que el usuario escribió.
const MAX_BYTES = 72;
const MIN_CARACTERES = 8;

// Tope duro para el login: evita gastar CPU en cuerpos enormes antes de rechazarlos.
const MAX_LONGITUD_ENTRADA = 256;

const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

// Hash de relleno con el MISMO costo que los reales: cuando el correo no existe se
// compara contra él, y así el tiempo de respuesta no revela qué correos están registrados.
const DUMMY_HASH = bcrypt.hashSync('contraseña-de-relleno-no-usar', BCRYPT_ROUNDS);

const esHashBcrypt = (valor) => typeof valor === 'string' && BCRYPT_REGEX.test(valor);

/**
 * Devuelve la lista de problemas de la contraseña según la política (vacía = válida).
 * La usan el guard (respuesta 422 legible) y el servicio (defensa en profundidad).
 */
const problemasDePolitica = (password, { username, email } = {}) => {
  if (typeof password !== 'string') return ['La contraseña es obligatoria'];

  const problemas = [];
  if (password.length < MIN_CARACTERES) problemas.push(`Mínimo ${MIN_CARACTERES} caracteres`);
  if (Buffer.byteLength(password, 'utf8') > MAX_BYTES) problemas.push(`Máximo ${MAX_BYTES} bytes (unos 72 caracteres sin tildes)`);
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) problemas.push('Debe tener al menos una letra y un número');
  if (password.trim() !== password) problemas.push('No puede empezar ni terminar con espacios');

  const p = password.toLowerCase();
  const usuario = typeof username === 'string' ? username.trim().toLowerCase() : '';
  const localEmail = typeof email === 'string' ? email.trim().toLowerCase().split('@')[0] : '';
  if ((usuario.length >= 3 && p.includes(usuario)) || (localEmail.length >= 3 && p.includes(localEmail))) {
    problemas.push('No puede contener el usuario ni el correo');
  }

  return problemas;
};

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

/**
 * Compara en tiempo ~constante. Si `hash` falta o no es un bcrypt válido
 * (usuario inexistente o dato corrupto), compara contra DUMMY_HASH y devuelve false.
 */
const verificarPassword = async (password, hash) => {
  if (typeof password !== 'string' || password.length > MAX_LONGITUD_ENTRADA) {
    await bcrypt.compare('x', DUMMY_HASH);
    return false;
  }
  if (!esHashBcrypt(hash)) {
    await bcrypt.compare(password, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(password, hash);
};

// true si el hash se generó con un costo menor al actual (hay que regenerarlo)
const necesitaRehash = (hash) => esHashBcrypt(hash) && bcrypt.getRounds(hash) < BCRYPT_ROUNDS;

module.exports = {
  BCRYPT_ROUNDS,
  MAX_LONGITUD_ENTRADA,
  esHashBcrypt,
  problemasDePolitica,
  hashPassword,
  verificarPassword,
  necesitaRehash,
};
