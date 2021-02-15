/*
    Rutas de Diseños
    host + /api/design
*/
const express = require('express');
const { getRecentDesigns,
    getUserDesignsAndFoldersByPath,
    getDesignsSharedWithUser,
    deleteDesign,
    getPublicDesignsByUser,
} = require('../controllers/design');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.get('/recent', validateJWT, getRecentDesigns);
router.post('/user', validateJWT, getUserDesignsAndFoldersByPath);
router.get('/shared-with-user', validateJWT, getDesignsSharedWithUser);
router.post('/public/user/', validateJWT, getPublicDesignsByUser);
router.delete('/:id', validateJWT, deleteDesign);

module.exports = router;