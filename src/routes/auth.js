
/*
    Rutas de Usuarios / Auth
    host + /api/auth
*/
const express = require('express');
const { LoginUser, register } = require('../controllers/auth');
const router = express.Router();

router.post('/login', LoginUser);
router.post('/register', register);

module.exports = router;