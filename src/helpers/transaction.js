'use strict';

const pool = require('../config/database');

// Ejecuta fn(conn) dentro de una transacción: commit si termina bien, rollback si lanza.
const withTransaction = async (fn) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = { withTransaction };
