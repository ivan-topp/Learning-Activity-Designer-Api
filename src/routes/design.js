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
    createDesign,
    getPublicFilteredDesigns,
} = require('../controllers/design');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.get('/recent', validateJWT, getRecentDesigns);
router.post('/', validateJWT, createDesign);
router.post('/user', validateJWT, getUserDesignsAndFoldersByPath);
router.post('/shared-with-user', validateJWT, getDesignsSharedWithUser);
router.post('/public/user/', validateJWT, getPublicDesignsByUser);
router.delete('/:id', validateJWT, deleteDesign);
router.post('/public-repository', validateJWT, getPublicFilteredDesigns);

module.exports = router;