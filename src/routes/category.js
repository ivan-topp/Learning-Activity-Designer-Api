/*
    Rutas de Categorias / category
    host + /api/category
*/
const express = require('express');
const { getCategories } = require('../controllers/category');
const { validateJWT } = require('../middlewares/validateJWT');
const router = express.Router();

router.get('/', validateJWT, getCategories);

module.exports = router;