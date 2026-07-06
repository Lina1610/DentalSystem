const pool = require('../config/database');

const User = {};

User.findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM usuario');
  return rows;
};

User.findByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT * FROM usuario WHERE email = ?',
    [email]
  );
  return rows[0];
};

module.exports = User;