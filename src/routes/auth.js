
/*
    Rutas de Usuarios / Auth
    host + /api/auth
*/
const express = require('express');
const { login, register, renewToken, updatePassword } = require('../controllers/auth');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/renew', validateJWT, renewToken);
router.put('/reset-password/:uid', updatePassword);

module.exports = router;