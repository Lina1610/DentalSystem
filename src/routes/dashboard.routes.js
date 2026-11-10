const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { guardsResumen } = require('../middlewares/validation/dashboard.guard');

router.get(
  '/',
  guardsResumen,
  dashboardController.obtenerResumen
);

module.exports = router;
