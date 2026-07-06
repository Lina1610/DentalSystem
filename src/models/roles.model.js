const pool = require('../config/database');

const Role = {};

Role.findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM rol');
  return rows;
};

Role.findByEmail = async (correo) => {

  const [rows] = await pool.query(
    'SELECT * FROM usuario WHERE correo = ?',
    [correo]
  );

  return rows[0];
};

module.exports = Role;