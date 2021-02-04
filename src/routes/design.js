/*
    Rutas de Diseños
    host + /api/designs
*/
const express = require('express');
const { getRecentDesigns, getUserDesignsAndForldersByPath, getDesignsSharedWithUser } = require('../controllers/design');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.get('/recent', validateJWT, getRecentDesigns);
router.post('/user', validateJWT, getUserDesignsAndForldersByPath);
router.get('/shared-with-user', validateJWT, getDesignsSharedWithUser);

module.exports = router;