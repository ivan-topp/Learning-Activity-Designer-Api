const express = require('express');
const app = express();

app.use('/api/auth', require('./auth'));
app.use('/api/design', require('./design'));
app.use('/api/folder', require('./folder'));

app.get('*', (req, res) =>{
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

module.exports = app;