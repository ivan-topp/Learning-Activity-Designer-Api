/*
    Rutas de Diseños
    host + /api/design
*/
const express = require('express');
const { getRecentDesigns, getUserDesignsAndForldersByPath, getDesignsSharedWithUser, deleteDesign } = require('../controllers/design');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.get('/recent', validateJWT, getRecentDesigns);
router.post('/user', validateJWT, getUserDesignsAndForldersByPath);
router.get('/shared-with-user', validateJWT, getDesignsSharedWithUser);deleteDesign
router.delete('/:id', validateJWT, deleteDesign);

module.exports = router;