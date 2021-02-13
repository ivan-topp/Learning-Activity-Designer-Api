/*
    Rutas de Diseños
    host + /api/folder
*/
const express = require('express');
const { deleteFolder, getFoldersByPath } = require('../controllers/folder');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.delete('/:id', validateJWT, deleteFolder);
router.post('/user', validateJWT, getFoldersByPath);

module.exports = router;