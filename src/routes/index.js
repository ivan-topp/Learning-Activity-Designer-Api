const express = require('express');
const app = express();
const path = require('path');

app.use('/api/auth', require('./auth'));
app.use('/api/design', require('./design'));
app.use('/api/user', require('./user'));
app.use('/api/folder', require('./folder'));
app.use('/api/category', require('./category'));
app.use('/api/bloom', require('./bloom'));

app.get('*', (req, res) =>{
    res.sendFile(path.join(path.resolve(__dirname, '../../public/index.html')));
});

module.exports = app;