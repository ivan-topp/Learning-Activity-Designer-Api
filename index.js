require('./src/config/config');
const express = require('express');
const path = require('path');
const { dbConnection } = require('./src/config/database');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const rootrouter = require('./src/routes');
const app = express();

dbConnection();

app.use(cors());

app.use(express.static('public'));

//  parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

//  parse application/json
app.use(bodyParser.json());

app.use(rootrouter);

app.listen(process.env.PORT, () => {
    console.log('Escuchando puerto: ', process.env.PORT);
});