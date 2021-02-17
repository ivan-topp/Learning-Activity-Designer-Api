const socketsConfig = ( io ) => {
    io.on('connection', ( socket ) => {
        console.log('Cliente conectado');

        socket.on('disconnect', () => {
            console.log('cliente desconectado');
        });

        socket.on('join-to-design', ({ user, design }) => {
            socket.join(design);
            io.to(design).emit('joined', [user]);
        });
    });
};

module.exports = socketsConfig;