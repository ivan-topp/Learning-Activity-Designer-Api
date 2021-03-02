/*
    Rutas de Categorias / bloom
    host + /api/bloom
*/
const express = require('express');
const { getBloomCategories } = require('../controllers/bloomCategory');
const { getBloomVerbs } = require('../controllers/bloomVerb');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.get('/category', validateJWT, getBloomCategories);
router.post('/verb', validateJWT, getBloomVerbs);

module.exports = router;