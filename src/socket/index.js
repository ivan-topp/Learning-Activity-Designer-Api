const mongoose = require("mongoose");
const Category = require("../models/Category");
const Design = require("../models/Design");
const { DesignRoom } = require("../models/DesignRoom");
const { DesignRoomList } = require("../models/DesignRoomList");
const { verifyJWT } = require("../utils/jwt");


const socketsConfig = ( io ) => {
    const designRooms = new DesignRoomList();
    io.on('connection', ( socket ) => {

        const [ isValid, uid ] = verifyJWT(socket.handshake.query['x-token']);
        if(!isValid){
            console.log('Socket no identificado');
            return socket.disconnect();
        }
        console.log('Se ha conectado el usuario: ', uid);

        socket.on('disconnect', () => {
            console.log('Se ha desconectado el usuario: ', uid);     
        });

        socket.on('disconnecting', () => {
            socket.rooms.forEach(room => {
                if(socket.id !== room){
                    const designRoom = designRooms.getDesignRoomById(room);
                    if (designRoom) {
                        designRoom.removeUser( socket.id );
                        return io.to(designRoom.id).emit('users', designRoom.getUsers());
                    }
                }
            });
        });

        socket.on('join-to-design', async ({ user, designId }, callback) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let resp = { ok: false, message: 'Ha ocurrido un error, el diseño no existe o usted no tiene privilegios para editar este diseño.'};
            if (mongoose.Types.ObjectId.isValid(designId)){
                if( !designRoom ) {
                    const isEditor = await DesignRoom.hasEditor(designId, uid);
                    if(isEditor){
                        designRoom = await designRooms.addDesignRoom( designId );
                        if( designRoom ) {
                            socket.join( designId );
                            resp = { ok: true, message: 'Usuario ingresado a la sala con éxito.', data: { design: designRoom.design }};
                            io.to(designId).emit('users', designRoom.addUser( {...user, socketId: socket.id} ));
                        }
                    }
                }else{
                    socket.join( designId );
                    resp = { ok: true, message: 'Usuario ingresado a la sala con éxito.', data: { design: designRoom.design }};
                    io.to(designId).emit('users', designRoom.addUser( {...user, socketId: socket.id} ));
                }
            }
            return callback(resp);
        });

        socket.on('leave-from-design', ({ user, designId }) => {
            socket.leave( designId );
            let designRoom = designRooms.getDesignRoomById( designId );
            if (designRoom) {
                designRoom.removeUser( socket.id );
                return io.to(designId).emit('users', designRoom.getUsers());
            }
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
                design.metadata.category = mongoose.Types.ObjectId(design.metadata.category._id);
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
            design.data.learningActivities[index][field] = value;
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on( 'new-learningActivity', ({ designId }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            const newTla = {
                title: '',
                description: '',
                task: [],
                learningResults: [],
            } 
            if(design.data.learningActivities === undefined){
                design.data.learningActivities = [newTla]
                return io.to(designId).emit('update-design', designRoom.design)
            };
            design.data.learningActivities = [...design.data.learningActivities, newTla];
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on('delete-learningActivity', ({ designId, index })=>{
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.data.learningActivities.splice( index, 1);
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on('edit-task-field', ({ designId, learningActivityIndex, index, field, value }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.data.learningActivities[learningActivityIndex].tasks[index][field] = value;
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on( 'new-task', ({ designId, index }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            const newTasks = {
                description: '',
                learningType: '',
                format: '',
                modality: '',
                duration: '',
            }
            if(design.data.learningActivities[index].tasks === undefined){
                design.data.learningActivities[index].tasks = [newTasks]
                return io.to(designId).emit('update-design', designRoom.design)
            };
            design.data.learningActivities[index].tasks = [...design.data.learningActivities[index].tasks, newTasks];
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on( 'delete-task', ({ designId, learningActivityIndex, index })=>{
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.data.learningActivities[learningActivityIndex].tasks.splice( index, 1);
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
            const targetLearningResult = design.metadata.results[index];
            design.data.learningActivities.forEach(learningActivity => {
                learningActivity.learningResults.forEach((lr, i)=>{
                    if(lr.verb === targetLearningResult.verb && lr.description === targetLearningResult.description) learningActivity.learningResults[i] = learningResult;
                });
            });
            design.metadata.results[index] = learningResult;
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on('delete-learning-result', ({designId, index}) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            const targetLearningResult = design.metadata.results[index];
            design.data.learningActivities.forEach(learningActivity => {
                learningActivity.learningResults.forEach((lr, i)=>{
                    if(lr.verb === targetLearningResult.verb && lr.description === targetLearningResult.description) learningActivity.learningResults.splice(i, 1);
                });
            });
            design.metadata.results.splice(index, 1);
            return io.to(designId).emit('update-design', designRoom.design);
        });
        
        socket.on('add-learning-result-to-learningActivity', ({designId, index, result}) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.data.learningActivities[index].learningResults = [...design.data.learningActivities[index].learningResults, result];
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on('delete-learning-result-from-learningActivity', ({designId, index, indexLearningResults}) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.data.learningActivities[index].learningResults.splice(indexLearningResults, 1);
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on('change-design-privileges', async({designId, privileges}) =>{
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            const newDesign = await Design.findByIdAndUpdate(designId, {privileges}, {new: true});
            if (newDesign) {
                design.privileges = privileges;
                return io.to(designId).emit('change-design-privileges', privileges);
            } else {
                return io.to(designId).emit('error', { ok: false, message: 'Error al intentar registrar usuarios al diseño.' });
            }
        });
    });
};

module.exports = socketsConfig;