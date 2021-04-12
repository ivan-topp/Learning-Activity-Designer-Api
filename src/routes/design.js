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
    getDesignByLink,
    duplicateDesign,
} = require('../controllers/design');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.get('/recent', validateJWT, getRecentDesigns);
router.get('/shared-link/:link', getDesignByLink);
router.post('/', validateJWT, createDesign);
router.post('/duplicate', validateJWT, duplicateDesign);
router.post('/user', validateJWT, getUserDesignsAndFoldersByPath);
router.post('/shared-with-user', validateJWT, getDesignsSharedWithUser);
router.post('/public/user/', validateJWT, getPublicDesignsByUser);
router.post('/public-repository', validateJWT, getPublicFilteredDesigns);
router.delete('/:id', validateJWT, deleteDesign);



module.exports = router;