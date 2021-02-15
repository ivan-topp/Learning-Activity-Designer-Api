/*
    Rutas de Usuarios
    host + /api/user
*/
const express = require('express');
const { getUserProfile, searchOtherUserProfile, addNewContact, deleteContact, updateUser } = require('../controllers/user');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.get('/:uid', validateJWT, getUserProfile);
router.post('/user', validateJWT, searchOtherUserProfile);
router.put('/:uid', validateJWT, updateUser);

module.exports = router;