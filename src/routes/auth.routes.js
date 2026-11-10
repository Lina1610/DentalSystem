const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { limitarLogin } = require('../middlewares/rateLimit.middleware');

router.post('/login', limitarLogin, authController.login);

module.exports = router;
