/*
    Rutas de Usuarios
    host + /api/user
*/
const express = require('express');
const { updateUser, searchUsers, getUser } = require('../controllers/user');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.put('/:uid', validateJWT, updateUser);
router.get('/:uid', validateJWT, getUser);
router.post('/search', validateJWT, searchUsers);

module.exports = router;