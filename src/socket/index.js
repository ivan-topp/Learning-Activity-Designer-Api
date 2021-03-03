const mongoose = require("mongoose");
const Category = require("../models/Category");
const Design = require("../models/Design");
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
        // TODO: Verify that the user is editor of the design.
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

        socket.on('edit-metadata-field', ({ designId, field, value }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.metadata[field] = value;
            
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on('save-design', async ({ designId }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = JSON.parse(JSON.stringify(designRoom.design));
            try {
                //console.log(design.metadata);
                design.metadata.category = mongoose.Types.ObjectId(design.metadata.category._id);
                //console.log(design.metadata);
                const updatedDesign = await Design.findByIdAndUpdate(design._id, design, {new: true}).populate({ path: 'metadata.category', model: Category });
                if (!updatedDesign) return io.to(designId).emit('error', { ok: false, message: 'Error al intentar guardar los cambios.' });
                console.log('diseño guardado con éxito');
                return io.to(designId).emit('update-design', designRoom.design);
            } catch (error) {
                console.log(error);
                return io.to(designId).emit('error', { ok: false, message: 'Error al intentar guardar los cambios.' });
            }
        });
        
        socket.on('edit-unit-field', ({ designId, index, field, value }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.data.tlas[index][field] = value;
            console.log(design.data.tlas)
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on( 'new-tla', ({ designId }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            const newTla = {
                title: '',
                description: ''
            } 
            design.data.tlas = [...design.data.tlas, newTla];
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on('delete-tla', ({ designId, index })=>{
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.data.tlas.splice( index, 1);
            return io.to(designId).emit('update-design', designRoom.design);
        })

        socket.on('add-learning-result', ({designId, learningResult}) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.metadata.results = [...design.metadata.results, learningResult];
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on('edit-learning-result', ({designId, index, learningResult}) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.metadata.results[index] = learningResult;
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on('delete-learning-result', ({designId, index}) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.metadata.results.splice(index, 1);
            return io.to(designId).emit('update-design', designRoom.design);
        });
    });
};

module.exports = socketsConfig;