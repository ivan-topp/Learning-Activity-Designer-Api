/*
    Rutas de Usuarios
    host + /api/user
*/
const express = require('express');
const { getUserProfile, searchOtherUserProfile } = require('../controllers/user');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.get('/:uid', validateJWT, getUserProfile);
router.post('/user', validateJWT, searchOtherUserProfile);

module.exports = router;