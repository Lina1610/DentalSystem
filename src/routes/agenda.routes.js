const express = require('express');
const router = express.Router();

const agendaController = require('../controllers/agenda.controller');
const {
  guardsCrear,
  guardsActualizar,
  guardsId,
} = require('../middlewares/validation/agenda.guard');

// IMPORTANTE: /disponibles debe ir antes de /:id para que no lo capture como id
router.get('/disponibles', agendaController.obtenerDisponibles);

router.get('/', agendaController.obtenerTodos);

router.post('/', guardsCrear, agendaController.crear);

router.get('/:id', guardsId, agendaController.obtenerPorId);

router.put('/:id', guardsActualizar, agendaController.actualizar);

router.patch('/:id/estado', guardsId, agendaController.cambiarEstado);

module.exports = router;
