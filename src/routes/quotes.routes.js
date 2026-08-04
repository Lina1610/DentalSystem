const express = require('express');
const router = express.Router();

const quotesController = require('../controllers/quotes.controller');
const {
  guardsCrear,
  guardsActualizar,
  guardsId,
} = require('../middlewares/validation/quotes.guard');

router.get(
  '/',
  quotesController.obtenerTodos
);

router.post(
  '/',
  guardsCrear,
  quotesController.crear
);

router.get(
  '/:id',
  guardsId,
  quotesController.obtenerPorId
);

router.put(
  '/:id',
  guardsActualizar,
  quotesController.actualizar
);

router.delete(
  '/:id',
  guardsId,
  quotesController.eliminar
);

router.patch(
  '/:id/estado',
  guardsId,
  quotesController.cambiarEstado
);

module.exports = router;