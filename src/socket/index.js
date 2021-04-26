const mongoose = require("mongoose");
const Category = require("../models/Category");
const Design = require("../models/Design");
const { DesignRoom } = require("../models/DesignRoom");
const { DesignRoomList } = require("../models/DesignRoomList");
const { verifyJWT } = require("../utils/jwt");
const { v4: uuidv4, } = require('uuid');


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
        
        socket.on('join-to-design', async ({ user, designId, public }, callback) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let resp = { ok: false, message: 'Ha ocurrido un error, el diseño no existe o usted no tiene privilegios para ver o editar este diseño.'};
            if (mongoose.Types.ObjectId.isValid(designId)){
                const isEditor = await DesignRoom.hasEditor(designId, uid);
                const isReader = await DesignRoom.hasReader(designId, uid);
                if( !designRoom ) {
                    if(isEditor){
                        designRoom = await designRooms.addDesignRoom( designId );
                        if( designRoom ) {
                            socket.join( designId );
                            resp = { ok: true, message: 'Usuario ingresado a la sala con éxito.', data: { design: designRoom.design }};
                            io.to(designId).emit('users', designRoom.addUser( {...user, socketId: socket.id} ));
                        }
                    } else if (isReader) {
                        designRoom = await designRooms.addDesignRoom( designId );
                        if( designRoom && public) {
                            socket.join( designId );
                            resp = { ok: true, message: 'Usuario ingresado a la sala con éxito.', data: { design: designRoom.design }};
                            io.to(designId).emit('users', designRoom.addUser( {...user, socketId: socket.id} ));
                        }
                    }
                } else {
                    if(isEditor){
                        socket.join( designId );
                        resp = { ok: true, message: 'Usuario ingresado a la sala con éxito.', data: { design: designRoom.design }};
                        io.to(designId).emit('users', designRoom.addUser( {...user, socketId: socket.id} ));
                    } else if (isReader) {
                        if( public) {
                            socket.join( designId );
                            resp = { ok: true, message: 'Usuario ingresado a la sala con éxito.', data: { design: designRoom.design }};
                            io.to(designId).emit('users', designRoom.addUser( {...user, socketId: socket.id} ));
                        }
                    }
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

        socket.on('edit-metadata-field', ({ designId, field, value, subfield=null }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            if (subfield !== null) design.metadata[field][subfield] = value;
            else design.metadata[field] = value;
            return io.to(designId).emit('edit-metadata-field', { field, value, subfield });
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
        
        socket.on('edit-unit-field', ({ designId, learningActivityID, field, value }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            try {
                design.data.learningActivities.forEach((la, index)=>{
                    if(la.id === learningActivityID){
                        design.data.learningActivities[index][field] = value;
                        return io.to(designId).emit('update-design', designRoom.design);
                    }
                });
            } catch (error) {
                console.log(error.message);
            }
        });

        socket.on( 'new-learningActivity', ({ designId, id }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            const newTla = {
                id,
                title: '',
                description: '',
                tasks: [],
                learningResults: [],
                evaluation: {
                    title: '',
                    description: ''
                }
            }
            design.data.learningActivities = [...design.data.learningActivities, newTla];
            return io.to(designId).emit('update-design', designRoom.design);
        });

        socket.on('add-evaluation-in-activity', async({designId, learningActivityID, evaluation}) =>{
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            
            const newDesign = await Design.findByIdAndUpdate(designId, {evaluation}, {new: true});
            if (newDesign) {
                design.data.learningActivities.forEach((la, index)=>{
                    if(la.id === learningActivityID){
                        design.data.learningActivities[index].evaluation = evaluation;
                        return io.to(designId).emit('update-design', designRoom.design);
                    }
                });
            } else {
                return io.to(designId).emit('error', { ok: false, message: 'Error al intentar registrar el o los recursos.' });
            }
        });

        socket.on('delete-learningActivity', ({ designId, learningActivityID })=>{
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.data.learningActivities.forEach((la, index)=>{
                if(la.id === learningActivityID){
                    design.data.learningActivities.splice( index, 1);
                    return io.to(designId).emit('update-design', designRoom.design);
                }
            });
        });

        socket.on('edit-task-field', ({ designId, learningActivityID, taskID, field, value, subfield }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            try {
                const l = design.data.learningActivities.find(la => la.id === learningActivityID);
                const nT = l.tasks.find(t => t.id === taskID);
                if(subfield !== null) nT[field][subfield] = value;
                else nT[field] = value;
                return io.to(designId).emit('edit-task-field', { learningActivityID, taskID, field, value, subfield });
            } catch (error) {
                console.log(error.message);
            }
        });

        socket.on( 'new-task', ({ designId, learningActivityID, id }) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            const newTask = {
                id,
                description: '',
                learningType: '',
                format: '',
                modality: '',
                duration: {
                    hours: 0,
                    minutes: 0,
                },
                resourceLinks:[],
                groupSize: 0, 
            }
            design.data.learningActivities.forEach((la, index)=>{
                if(la.id === learningActivityID){
                    design.data.learningActivities[index].tasks = [...design.data.learningActivities[index].tasks, newTask];
                    return io.to(designId).emit('update-design', designRoom.design)
                }
            });
        });
        // designId: design._id, learningActivityID, taskID: task.id
        socket.on( 'delete-task', ({ designId, learningActivityID, taskID })=>{
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.data.learningActivities.forEach((la, index) => {
                if(la.id === learningActivityID){
                    design.data.learningActivities[index].tasks = design.data.learningActivities[index].tasks.filter((t, i) => t.id !== taskID);
                }
            });
            return io.to(designId).emit('update-design', designRoom.design);
        })

        socket.on('change-resource-in-task', async({designId, learningActivityIndex, taskIndex, resources}) =>{
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            const newDesign = await Design.findByIdAndUpdate(designId, {resources}, {new: true});
            if (newDesign) {
                design.data.learningActivities[learningActivityIndex].tasks[taskIndex].resourceLinks = resources;
                return io.to(designId).emit('update-design', designRoom.design);
            } else {
                return io.to(designId).emit('error', { ok: false, message: 'Error al intentar registrar el o los recursos.' });
            }
        });

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
        // learningActivityID: learningActivity.id
        socket.on('add-learning-result-to-learningActivity', ({designId, learningActivityID, result}) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            for (const [index, la] of design.data.learningActivities.entries()) {
                if(la.id === learningActivityID){
                    design.data.learningActivities[index].learningResults = [...design.data.learningActivities[index].learningResults, result];
                    return io.to(designId).emit('update-design', designRoom.design);
                }
            }
        });

        socket.on('delete-learning-result-from-learningActivity', ({designId, learningActivityID, indexLearningResults}) => {
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            design.data.learningActivities.forEach((la, index) => {
                if(la.id === learningActivityID){
                    design.data.learningActivities[index].learningResults.splice(indexLearningResults, 1);
                    return io.to(designId).emit('update-design', designRoom.design);
                }
            });

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

        socket.on('add-design-keyword', async({designId, keyword}) =>{
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            let newKeywords = [...design.keywords];
            if(newKeywords.includes(keyword)) return io.to(designId).emit('error', { ok: false, message: 'La palabra clave ya existe.' });
            newKeywords = [...newKeywords, keyword];
            try {
                const newDesign = await Design.findByIdAndUpdate(designId, {keywords: newKeywords}, {new: true});
                if (newDesign) {
                    design.keywords = newKeywords;
                    return io.to(designId).emit('add-design-keyword', keyword);
                } else {
                    return io.to(designId).emit('error', { ok: false, message: 'Error al agregar la palabra clave.' });
                }
            } catch (error) {
                console.log(error);
                return io.to(designId).emit('error', { ok: false, message: 'Error al agregar la palabra clave.' });
            }
        });

        socket.on('remove-design-keyword', async({designId, keyword}) =>{
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            let newKeywords = [...design.keywords];
            newKeywords = newKeywords.filter( k => k !== keyword );
            try {
                const newDesign = await Design.findByIdAndUpdate(designId, {keywords: newKeywords}, {new: true});
                if (newDesign) {
                    design.keywords = newKeywords;
                    return io.to(designId).emit('remove-design-keyword', keyword);
                } else {
                    return io.to(designId).emit('error', { ok: false, message: 'Error al eliminar la palabra clave.' });
                }
            } catch (error) {
                console.log(error);
                return io.to(designId).emit('error', { ok: false, message: 'Error al eliminar la palabra clave.' });
            }
        });

        socket.on('generate-new-share-link', async({ designId }) =>{
            let designRoom = designRooms.getDesignRoomById( designId );
            let design = designRoom.design;
            try {
                const newLink = uuidv4();
                const newDesign = await Design.findByIdAndUpdate(designId, { readOnlyLink: newLink }, {new: true});
                if (newDesign) {
                    design.readOnlyLink = newLink;
                    return io.to(designId).emit('change-read-only-link', newLink);
                } else {
                    return io.to(designId).emit('error', { ok: false, message: 'Error al generar el nuevo enlace.' });
                }
            } catch (error) {
                console.log(error);
                return io.to(designId).emit('error', { ok: false, message: 'Error al generar el nuevo enlace.' });
            }
        });
    });
};

module.exports = socketsConfig;