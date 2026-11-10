const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const { verificarToken } = require('./middlewares/auth.middleware');
const { soloRoles, ROLES } = require('./middlewares/roles.middleware');

const app = express();

// Detrás de un proxy (Nginx, balanceador) req.ip sería la IP del proxy y el límite
// de login se compartiría entre todos los usuarios. TRUST_PROXY = número de proxies
// delante de la API (p. ej. 1). Sin proxy, dejarlo sin definir: confiar en
// X-Forwarded-For sin proxy permite falsificar la IP y saltarse el límite.
const trustProxy = Number.parseInt(process.env.TRUST_PROXY, 10);
app.set('trust proxy', Number.isInteger(trustProxy) && trustProxy > 0 ? trustProxy : false);
app.disable('x-powered-by');

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

// Solo los orígenes listados en CORS_ORIGIN (separados por coma) pueden llamar a la API desde el navegador
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '100kb' }));

// Rutas públicas
app.use('/api/auth', require('./routes/auth.routes'));

// Rutas protegidas: requieren JWT válido y rol administrador
// (mismo criterio que el authGuard del frontend)
const protegido = [verificarToken, soloRoles(ROLES.ADMIN)];

app.use('/api/roles', protegido, require('./routes/roles.routes'));
app.use('/api/pacientes', protegido, require('./routes/patient.routes'));
app.use('/api/odontologos', protegido, require('./routes/dentist.routes'));
app.use('/api/quotes', protegido, require('./routes/quotes.routes'));
app.use('/api/services', protegido, require('./routes/service.routes'));
app.use('/api/agenda', protegido, require('./routes/agenda.routes'));
app.use('/api/dashboard', protegido, require('./routes/dashboard.routes'));

app.get('/', (req, res) => {
  res.send('API funcionando');
});

// Manejador global de errores (siempre al final)
app.use(require('./middlewares/error.middleware'));

module.exports = app;