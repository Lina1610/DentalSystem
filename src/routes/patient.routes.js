// =========================================================
// ROUTES: paciente.routes.js
// Conecta guards + controller
// =========================================================

const express = require('express');
const router = express.Router();

const pacienteController = require('../controllers/patient.controller');
const {
  guardsCrear,
  guardsActualizar,
  guardsId,
  guardsDocumento,
} = require('../middlewares/paciente.guard');

// const { verificarToken } = require('../middlewares/auth.middleware');
// const { soloRoles } = require('../middlewares/roles.middleware');

// ---------------------------------------------------------
// Rutas protegidas con JWT
// ---------------------------------------------------------

// GET    /pacientes               → listar todos
// POST   /pacientes               → crear
// GET    /pacientes/:id           → obtener por ID
// PUT    /pacientes/:id           → actualizar
// DELETE /pacientes/:id           → eliminar (soft)
// GET    /pacientes/documento/:d  → buscar por documento

router.get(
  '/',
  pacienteController.obtenerTodos
);

router.post(
  '/',
  guardsCrear,
  pacienteController.crear
);

router.get(
  '/documento/:documento',
  guardsDocumento,
  pacienteController.buscarPorDocumento
);

router.get(
  '/:id',
  guardsId,
  pacienteController.obtenerPorId
);

router.put(
  '/:id',
  guardsActualizar,
  pacienteController.actualizar
);

router.delete(
  '/:id',
  guardsId,
  pacienteController.eliminar
);

router.patch(
  '/:id/estado',
  guardsId,
  pacienteController.cambiarEstado
);

module.exports = router;