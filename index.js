require('dotenv').config();
require('./src/config/config');
const http = require('http')
const app = require('./src/app');
const socketsConfig = require('./src/socket');

const WebSocket = require('ws');
const setupWSConnection = require('./src/y-websocket-server/utils.js').setupWSConnection;
const wss = new WebSocket.Server({ noServer: true});

// API Rest y websocket server para app general

const server = http.createServer(app);

const io = require('socket.io')(server);

socketsConfig( io );

server.listen(process.env.PORT, () => {
    console.log('Server listen on port: ', process.env.PORT);
});

// Servidor WebSocket para la administración automática de documentos colaborativos

const yWebSocketServer = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' })
    response.end('okay')
});

const port = process.env.Y_WEBSOCKET_PORT || 1234;

wss.on('connection', setupWSConnection);

yWebSocketServer.on('upgrade', (request, socket, head) => {
  // You may check auth of request here..

  // @param {any} ws
  
  const handleAuth = ws => {
    wss.emit('connection', ws, request);
  };
  wss.handleUpgrade(request, socket, head, handleAuth);
});

yWebSocketServer.listen(port, ()=>{
    console.log(`Y websocket server listen on port: ${port}`);
});