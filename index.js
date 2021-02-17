require('./src/config/config');
const app = require('./src/app');
const socketsConfig = require('./src/socket');
require('dotenv').config();

const server = require('http').createServer(app);

const io = require('socket.io')(server);

socketsConfig( io );

server.listen(process.env.PORT, () => {
    console.log('Server listen on port: ', process.env.PORT);
});