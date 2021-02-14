/*
    Rutas de Usuarios
    host + /api/user
*/
const express = require('express');
const { getUser, searchUsers } = require('../controllers/user');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.get('/:uid', validateJWT, getUser);
router.post('/search/:filter', validateJWT, searchUsers);

module.exports = router;