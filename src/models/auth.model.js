const pool = require('../config/database');

const User = {};

User.findByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT id_usuario, id_rol, email, password_hash, estado
     FROM usuario
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
};

User.registrarLogin = async (idUsuario) => {
  await pool.query('UPDATE usuario SET ultimo_login = NOW() WHERE id_usuario = ?', [idUsuario]);
};

User.actualizarHash = async (idUsuario, hashAnterior, hashNuevo) => {
  await pool.query(
    'UPDATE usuario SET password_hash = ? WHERE id_usuario = ? AND password_hash = ?',
    [hashNuevo, idUsuario, hashAnterior]
  );
};

module.exports = User;
