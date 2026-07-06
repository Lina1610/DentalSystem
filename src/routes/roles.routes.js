const { Router } = require('express');
const { getRoles } = require('../controllers/roles.controller');

const router = Router();

router.get('/roles', getRoles);

module.exports = router;
 