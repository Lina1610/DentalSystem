const express = require('express');
const router = express.Router();

const serviceController = require('../controllers/service.controller');

const {
  guardsCrear,
  guardsActualizar,
  guardsId,
  guardsNombre,
} = require('../middlewares/validation/service.guard');

router.get(
  '/',
  serviceController.obtenerTodos
);

router.post(
  '/',
  guardsCrear,
  serviceController.crear
);

router.get(
  '/nombre/:nombre',
  guardsNombre,
  serviceController.obtenerPorNombre
);

router.put(
  '/:id',
  guardsActualizar,
  serviceController.actualizar
);

router.delete(
  '/:id',
  guardsId,
  serviceController.eliminar
);

router.patch(
  '/:id/estado',
  guardsId,
  serviceController.cambiarEstado
);

module.exports = router;