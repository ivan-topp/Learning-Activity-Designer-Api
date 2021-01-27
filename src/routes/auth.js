/*
    Rutas de Usuarios / Auth
    host + /api/auth
*/
const express = require('express');
const rootrouter = express.Router();
const {LoginUser} = require('../controllers/auth')

rootrouter.post('/login', LoginUser);

rootrouter.get('*', (req, res) =>{
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

module.exports = rootrouter