// =========================================================
// MIDDLEWARE: error.middleware.js
// Manejador global de errores — debe registrarse último en app.js
// =========================================================
'use strict';

const errorMiddleware = (err, req, res, next) => {

  // ── 1. Errores personalizados (NotFoundError, ConflictError, ValidationError)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // ── 2. Errores de MySQL (mysql2)
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        return res.status(409).json({ message: 'Ya existe un registro con ese valor duplicado.' });
      case 'ER_NO_REFERENCED_ROW_2':
        return res.status(400).json({ message: 'El ID referenciado no existe.' });
      case 'ER_ROW_IS_REFERENCED_2':
        return res.status(409).json({ message: 'No se puede eliminar: el registro está en uso.' });
      case 'ER_BAD_NULL_ERROR':
        return res.status(400).json({ message: 'Un campo obligatorio recibió un valor nulo.' });
    }
  }

  // ── 3. SyntaxError en el body JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'JSON inválido en el cuerpo de la solicitud.' });
  }

  // ── 4. Error genérico — no exponer detalles internos en producción
  const isDev = process.env.NODE_ENV !== 'production';
  console.error('[ERROR]', err);

  return res.status(500).json({
    message: 'Error interno del servidor.',
    ...(isDev && { detalle: err.message }),
  });
};

module.exports = errorMiddleware;
