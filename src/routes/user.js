/*
    Rutas de Usuarios
    host + /api/user
*/
const express = require('express');
const { updateUser, searchUsers, getUser, getUserByEmail, resendVerificationCode, updateUserImage } = require('../controllers/user');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.put('/:uid', validateJWT, updateUser);
router.get('/:uid', validateJWT, getUser);
router.post('/search', validateJWT, searchUsers);
router.put('/update/user-img', validateJWT, updateUserImage);
router.post('/search-by-email', getUserByEmail);
router.post('/resend-code', resendVerificationCode);

module.exports = router;