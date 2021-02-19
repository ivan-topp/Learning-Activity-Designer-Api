const { DesignRoomList } = require("../models/DesignRoomList");


const socketsConfig = ( io ) => {
    const designRooms = new DesignRoomList();
    io.on('connection', ( socket ) => {
        console.log('Cliente conectado');

        socket.on('disconnect', () => {
            console.log('cliente desconectado');         
        });

        socket.on('disconnecting', () => {
            socket.rooms.forEach(room => {
                if(socket.id !== room){
                    const designRoom = designRooms.getDesignRoomById(room);
                    designRoom.removeUser( socket.id );
                    io.to(room).emit('users', designRoom.getUsers());
                }
            });
        });

        socket.on('join-to-design', async ({ user, designId }, callback) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let resp = { ok: false, message: 'Error al intentar ingresar a la sala.'};
            if( !designRoom ) {
                designRoom = await designRooms.addDesignRoom( designId );
                if( designRoom ) {
                    socket.join( designId );
                    resp = { ok: true, message: 'Usuario ingresado a la sala con éxito.', data: { design: designRoom.design }};
                    io.to(designId).emit('users', designRoom.addUser( {...user, socketId: socket.id} ));
                }
            }else{
                socket.join( designId );
                resp = { ok: true, message: 'Usuario ingresado a la sala con éxito.', data: { design: designRoom.design }};
                io.to(designId).emit('users', designRoom.addUser( {...user, socketId: socket.id} ));
            }
            return callback(resp);
        });

        socket.on('leave-from-design', ({ user, designId }) => {
            socket.leave( designId );
            let designRoom = designRooms.getDesignRoomById( designId );
            designRoom.removeUser( socket.id );
            return io.to(designId).emit('users', designRoom.users);
        });
    });
};

module.exports = socketsConfig;