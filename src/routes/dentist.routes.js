const express = require('express');
const router = express.Router();

const dentistaController = require('../controllers/dentist.controller');
const {
  guardsCrear,
  guardsActualizar,
  guardsId,
  guardsDocumento,
} = require('../middlewares/validation/dentista.guard');

router.get(
  '/',
  dentistaController.obtenerTodos
);

router.post(
  '/',
  guardsCrear,
  dentistaController.crear
);

router.get(
  '/documento/:documento',
  guardsDocumento,
  dentistaController.buscarPorDocumento
);

router.get(
  '/:id',
  guardsId,
  dentistaController.obtenerPorId
);

router.put(
  '/:id',
  guardsActualizar,
  dentistaController.actualizar
);

router.patch(
  '/:id/estado',
  guardsId,
  dentistaController.cambiarEstado
);

module.exports = router;