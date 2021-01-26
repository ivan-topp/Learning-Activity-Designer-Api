const express = require('express');
const rootrouter = express.Router();

rootrouter.get('/', (req, res) =>{
    res.json({
        ok: true,
        msg: 'Listoco',
    });
});

rootrouter.get('*', (req, res) =>{
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

module.exports = rootrouter