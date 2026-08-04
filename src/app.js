const express = require('express');
const cors = require('cors');
const pool = require('./config/database');

const app = express();

async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la base de datos establecida correctamente.');
    connection.release();
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
  }
}

testDbConnection();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', require('./routes/roles.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/pacientes', require('./routes/patient.routes'));
app.use('/api/odontologos', require('./routes/dentist.routes'));
app.use('/api/quotes', require('./routes/quotes.routes'));

app.get('/', (req, res) => {
  res.send('API funcionando');
});

// Manejador global de errores (siempre al final)
app.use(require('./middlewares/error.middleware'));

module.exports = app;