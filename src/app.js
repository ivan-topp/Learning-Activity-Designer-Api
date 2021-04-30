const express = require('express');
const { dbConnection } = require('./config/database');
const cors = require('cors');
const bodyParser = require('body-parser');
const rootrouter = require('./routes');
const fileUpload = require('express-fileupload');
require('dotenv').config();
const app = express();

dbConnection();

app.use(cors());

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use(fileUpload({ useTempFiles: false }));

app.use(rootrouter);

module.exports = app;