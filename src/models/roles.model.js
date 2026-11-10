const pool = require('../config/database');

const Role = {};

Role.findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM rol');
  return rows;
};

module.exports = Role;
