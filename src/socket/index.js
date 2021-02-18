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
                    io.to(room).emit('joined', designRoom.getUsers());
                }
            });
        });

        socket.on('join-to-design', async ({ user, designId }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            if( !designRoom ) {
                designRoom = await designRooms.addDesignRoom( designId );
                if( designRoom ) {
                    socket.join( designId );
                    return io.to(designId).emit('joined', designRoom.addUser( {...user, socketId: socket.id} ));
                }
            }else{
                socket.join( designId );
                return io.to(designId).emit('joined', designRoom.addUser( {...user, socketId: socket.id} ));
            }
            return io.to(socket.id).emit('not-joined', { ok: false, message: 'Error al intentar ingresar a la sala.'});
        });

        socket.on('leave-from-design', ({ user, designId }) => {
            socket.leave( designId );
            let designRoom = designRooms.getDesignRoomById( designId );
            designRoom.removeUser( socket.id );
            return io.to(designId).emit('joined', designRoom.users);
        });
    });
};

module.exports = socketsConfig;