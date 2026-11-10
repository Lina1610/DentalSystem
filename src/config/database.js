const { createPool } = require('mysql2/promise');

const pool = createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'consultorio_odontologico',
    // Por defecto mysql2 devuelve DECIMAL como string ("100000.00"), y en el
    // frontend "100000.00" + 5 concatena en vez de sumar. Todas las columnas
    // DECIMAL del esquema son (10,2) y caben exactas en un number de JS.
    decimalNumbers: true,
});

module.exports = pool;
