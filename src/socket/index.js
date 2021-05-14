const mongoose = require("mongoose");
const Category = require("../models/Category");
const Design = require("../models/Design");
const { DesignRoom } = require("../models/DesignRoom");
const { DesignRoomList } = require("../models/DesignRoomList");
const { verifyJWT } = require("../utils/jwt");
const { v4: uuidv4, } = require('uuid');
const User = require("../models/User");


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
            let resp = { ok: false, message: 'Error al ingresar al diseño.'};
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                if (mongoose.Types.ObjectId.isValid(designId)){
                    const isEditor = await DesignRoom.hasEditor(designId, uid);
                    const isReader = await DesignRoom.hasReader(designId, uid);
                    if( !designRoom ) {
                        if(isEditor){
                            designRoom = await designRooms.addDesignRoom( designId );
                            if( designRoom ) {
                                socket.join( designId );
                                resp = { ok: true, message: 'Usuario ingresado a la sala con éxito.', data: { design: designRoom.design }};
                                io.to(designId).emit('users', designRoom.addUser( {...user, socketId: socket.id, privilege: isEditor ? 'Editor' : 'Lector' } ));
                            } else resp = { ok: false, message: 'Ha ocurrido un error, el diseño no existe o usted no tiene privilegios para editar este diseño.'};
                        } else if (isReader) {
                            designRoom = await designRooms.addDesignRoom( designId );
                            if( designRoom && public) {
                                socket.join( designId );
                                resp = { ok: true, message: 'Usuario ingresado a la sala con éxito.', data: { design: designRoom.design }};
                                io.to(designId).emit('users', designRoom.addUser( {...user, socketId: socket.id, privilege: isEditor ? 'Editor' : 'Lector' } ));
                            }else resp = { ok: false, message: 'Ha ocurrido un error, el diseño no existe o usted no tiene privilegios para visualizar este diseño.'};
                        }
                    } else {
                        if(isEditor){
                            socket.join( designId );
                            resp = { ok: true, message: 'Usuario ingresado a la sala con éxito.', data: { design: designRoom.design }};
                            io.to(designId).emit('users', designRoom.addUser( {...user, socketId: socket.id, privilege: isEditor ? 'Editor' : 'Lector' } ));
                        } else if (isReader) {
                            if( public) {
                                socket.join( designId );
                                resp = { ok: true, message: 'Usuario ingresado a la sala con éxito.', data: { design: designRoom.design }};
                                io.to(designId).emit('users', designRoom.addUser( {...user, socketId: socket.id, privilege: isEditor ? 'Editor' : 'Lector' } ));
                            }
                        }
                    }
                }
                return callback(resp);
            } catch (error) {
                console.log(error);
                return callback(resp);
            }
        });

        socket.on('leave-from-design', ({ user, designId }) => {
            socket.leave( designId );
            let designRoom = designRooms.getDesignRoomById( designId );
            if (designRoom) {
                designRoom.removeUser( socket.id );
                return io.to(designId).emit('users', designRoom.getUsers());
            }
        });

        socket.on('edit-metadata-field', ({ designId, field, value, subfield=null }, callback) => {
            let resp = subfield 
                ? { ok: false, message: `Error al intenar editar el campo "${subfield}" del campo "${field}".`}
                : { ok: false, message: `Error al intenar editar el campo "${field}".`};
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                if (subfield !== null) design.metadata[field][subfield] = value;
                else design.metadata[field] = value;
                io.to(designId).emit('edit-metadata-field', { field, value, subfield });
                return callback({ ok: true, message: 'Campo editado con exito.'});
            } catch (error) {
                return callback(resp);
            }
        });

        socket.on('save-design', async ({ designId }, callback) => {
            let resp = { ok: false, message: 'Error al intentar guardar los cambios.' };
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = JSON.parse(JSON.stringify(designRoom.design));
                design.metadata.category = mongoose.Types.ObjectId(design.metadata.category._id);
                if(design.origin) delete design.origin;
                const updatedDesign = await Design.findByIdAndUpdate(design._id, design, {new: true}).populate({ path: 'metadata.category', model: Category });
                if (!updatedDesign) return callback(resp);
                resp = { ok: true, message: 'Diseño se ha guardado con éxito.' };
                console.log('diseño guardado con éxito');
                io.to(designId).emit('update-design', designRoom.design);
                return callback(resp);
            } catch (error) {
                console.log(error);
                return callback(resp);
            }
        });
        
        socket.on('edit-unit-field', ({ designId, learningActivityID, field, value }, callback) => {
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                design.data.learningActivities.forEach((la, index)=>{
                    if(la.id === learningActivityID){
                        design.data.learningActivities[index][field] = value;
                        io.to(designId).emit('update-design', designRoom.design);
                        return callback({ ok: true, message: `El campo "${field}" de la actividad ha sido editado con éxito.` });
                    }
                });
            } catch (error) {
                console.log(error.message);
                return callback({ ok: false, message: `Error al editar el campo "${field}" de la actividad.` });
            }
        });

        socket.on( 'new-learningActivity', ({ designId, id }, callback) => {
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                const newTla = {
                    id,
                    title: '',
                    description: '',
                    tasks: [],
                    learningResults: [],
                    evaluation: []
                }
                design.data.learningActivities = [...design.data.learningActivities, newTla];
                io.to(designId).emit('update-design', designRoom.design);
                return callback({ ok: true, message: 'Nueva actividad de aprendizaje agregada con éxito.' });
            } catch (error) {
                return callback({ ok: false, message: 'Error al agregar la nueva actividad de aprendizaje.' });
            }
        });

        socket.on('add-evaluation-in-activity', async ({designId, learningActivityID, evaluation}, callback) =>{
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                design.data.learningActivities.forEach((la, index)=>{
                    if(la.id === learningActivityID){
                        design.data.learningActivities[index].evaluation = evaluation;
                        io.to(designId).emit('update-design', designRoom.design);
                        return callback({ ok: true, message: 'Se han modificado las evaluaciones con éxito.' });
                    }
                });
            } catch (error) {
                return callback({ ok: false, message: 'Error al modificar las evaluaciones de la actividad de aprendizaje.' });
            }
        });

        socket.on('delete-learningActivity', ({ designId, learningActivityID }, callback)=>{
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                design.data.learningActivities.forEach((la, index)=>{
                    if(la.id === learningActivityID){
                        design.data.learningActivities.splice( index, 1);
                        io.to(designId).emit('update-design', designRoom.design);
                        return callback({ ok: true, message: 'Actividad de aprendizaje eliminada con éxito.' });
                    }
                });
                return callback({ ok: false, message: 'Error al eliminar la actividad de aprendizaje, seguramente otro usuario la eliminó antes.' });
            } catch (error) {
                console.log(error);
                return callback({ ok: false, message: 'Error al eliminar la actividad de aprendizaje.' });
            }
        });
        
        socket.on('edit-task-field', ({ designId, learningActivityID, taskID, field, value, subfield, sumHours, sumMinutes }, callback) => {
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                const l = design.data.learningActivities.find(la => la.id === learningActivityID);
                const nT = l.tasks.find(t => t.id === taskID);
                if(subfield !== null) nT[field][subfield] = value;
                else nT[field] = value;
                if(field === 'duration'){
                    design.metadata['workingTimeDesign']['hours'] = 0;
                    let timeDesignMinutesOutOfRange = 0;
                    design.data.learningActivities.forEach(activity => activity.tasks.forEach((task)=>
                        sumHours = task.duration.hours + sumHours
                    ));
                    design.metadata['workingTimeDesign']['minutes'] = 0
                    design.data.learningActivities.forEach(activity => activity.tasks.forEach((task)=>{
                        sumMinutes = task.duration.minutes + sumMinutes
                        if( sumMinutes > 59){
                            timeDesignMinutesOutOfRange = sumMinutes - 60
                            sumHours = sumHours + 1
                            sumMinutes = timeDesignMinutesOutOfRange
                        }
                        }
                    ));
                    design.metadata['workingTimeDesign']['minutes'] = design.metadata['workingTimeDesign']['minutes'] + sumMinutes
                    design.metadata['workingTimeDesign']['hours'] = design.metadata['workingTimeDesign']['hours'] + sumHours
                    io.to(designId).emit('edit-metadata-field', { field, value, subfield });
                    io.to(designId).emit('update-design', designRoom.design);
                }
                io.to(designId).emit('edit-task-field', { learningActivityID, taskID, field, value, subfield });
                return callback({ ok: true, message: subfield 
                    ? `El campo "${subfield}" del campo "${field}" ha sido editado con éxito.` 
                    : `El campo "${field}" ha sido editado con éxito.` });
            } catch (error) {
                console.log(error.message);
                return callback({
                    ok: false,
                    message: subfield 
                        ? `Error al editar el campo "${subfield}" del campo "${field}".` 
                        : `Error al editar el campo "${field}".`
                });
            }
        });

        socket.on( 'new-task', ({ designId, learningActivityID, id }, callback) => {
            try {
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
                    groupSize: 2, 
                }
                design.data.learningActivities.forEach((la, index)=>{
                    if(la.id === learningActivityID){
                        design.data.learningActivities[index].tasks = [...design.data.learningActivities[index].tasks, newTask];
                        io.to(designId).emit('update-design', designRoom.design);
                        return callback({ ok: true, message: 'Tarea agregada con éxito.' });
                    }
                });
                return callback({ ok: false, message: 'Error al agregar la tarea.' });
            } catch (error) {
                return callback({ ok: false, message: 'Error al agregar la tarea.' });
            }
        });
        
        socket.on( 'delete-task', ({ designId, learningActivityID, taskID }, callback)=>{
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                design.data.learningActivities.forEach((la, index) => {
                    if(la.id === learningActivityID){
                        design.data.learningActivities[index].tasks = design.data.learningActivities[index].tasks.filter((t, i) => t.id !== taskID);
                    }
                });
                io.to(designId).emit('update-design', designRoom.design);
                return callback({ ok: true, message: 'Tarea eliminada con éxito.' });
            } catch (error) {
                return callback({ ok: false, message: 'Error al eliminar la tarea.' });
            }
        })

        socket.on('change-resource-in-task', async ({designId, learningActivityIndex, taskIndex, resources}, callback) =>{
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                design.data.learningActivities[learningActivityIndex].tasks[taskIndex].resourceLinks = resources;
                io.to(designId).emit('update-design', designRoom.design);
                return callback({ ok: true, message: 'Recursos modificados con éxito.' });
            } catch (error) {
                return callback({ ok: false, message: 'Error al modificar los recursos en la tarea.' });
            }
        });

        socket.on('add-learning-result', ({designId, learningResult}, callback) => {
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                design.metadata.results = [...design.metadata.results, learningResult];
                io.to(designId).emit('update-design', designRoom.design);
                return callback({ ok: true, message: 'Resultado de aprendizaje agregado con éxito.' });
            } catch (error) {
                console.log(error);
                return callback({ ok: false, message: 'Error al agregar el resultado de aprendizaje.' });
            }
        });

        socket.on('edit-learning-result', ({designId, index, learningResult}, callback) => {
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                const targetLearningResult = design.metadata.results[index];
                design.data.learningActivities.forEach(learningActivity => {
                    learningActivity.learningResults.forEach((lr, i)=>{
                        if(lr.verb === targetLearningResult.verb && lr.description === targetLearningResult.description) learningActivity.learningResults[i] = learningResult;
                    });
                });
                design.metadata.results[index] = learningResult;
                io.to(designId).emit('update-design', designRoom.design);
                return callback({ ok: true, message: 'Resultado de aprendizaje editado con éxito.' });
            } catch (error) {
                console.log(error);
                return callback({ ok: false, message: 'Error al agregar el resultado de aprendizaje.' });
            }
        });

        socket.on('delete-learning-result', ({designId, index}, callback) => {
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                const targetLearningResult = design.metadata.results[index];
                design.data.learningActivities.forEach(learningActivity => {
                    learningActivity.learningResults.forEach((lr, i)=>{
                        if(lr.verb === targetLearningResult.verb && lr.description === targetLearningResult.description) {
                            learningActivity.learningResults.splice(i, 1);
                        }
                    });
                });
                design.metadata.results.splice(index, 1);
                io.to(designId).emit('update-design', designRoom.design);
                return callback({ ok: true, message: 'Resultado de aprendizaje eliminado con éxito.' });
            } catch (error) {
                return callback({ ok: false, message: 'Error al eliminar el resultado de aprendizaje.' });
            }
        });
        
        socket.on('add-learning-result-to-learningActivity', ({designId, learningActivityID, result}, callback) => {
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                for (const [index, la] of design.data.learningActivities.entries()) {
                    if(la.id === learningActivityID){
                        design.data.learningActivities[index].learningResults = [...design.data.learningActivities[index].learningResults, result];
                        io.to(designId).emit('update-design', designRoom.design);
                        return callback({ ok: true, message: 'Resultado de aprendizaje vinculado a la actividad con éxito.' });
                    }
                }
                return callback({ ok: false, message: 'Error al vincular el resultado de aprendizaje a la actividad, es probable que otro usuario lo haya vinculado antes.' });
            } catch (error) {
                return callback({ ok: false, message: 'Error al vincular el resultado de aprendizaje a la actividad.' });
            }
        });

        socket.on('delete-learning-result-from-learningActivity', ({designId, learningActivityID, indexLearningResults}, callback) => {
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                design.data.learningActivities.forEach((la, index) => {
                    if(la.id === learningActivityID){
                        design.data.learningActivities[index].learningResults.splice(indexLearningResults, 1);
                        io.to(designId).emit('update-design', designRoom.design);
                        return callback({ ok: true, message: 'Resultado de aprendizaje desvinculado de la actividad con éxito.' });
                    }
                });
                return callback({ ok: false, message: 'Error al desvincular el resultado de aprendizaje de la actividad, es probable que otro usuario lo haya desvinculado antes.' });
            } catch (error) {
                return callback({ ok: false, message: 'Error al desvincular el resultado de aprendizaje de la actividad.' });
            }

        });

        socket.on('change-design-privileges', async ({designId, privileges}, callback) =>{
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                const newDesign = await Design.findByIdAndUpdate(designId, {privileges}, {new: true});
                if (newDesign) {
                    design.privileges = privileges;
                    io.to(designId).emit('change-design-privileges', privileges);
                    return callback({ ok: true, message: 'Diseño compartido con éxito.'});
                } else return callback({ ok: false, message: 'Error al compartir el diseño.'});
            } catch (error) {
                return callback({ ok: false, message: 'Error al compartir el diseño.'});
            }
        });

        socket.on('add-design-keyword', async({designId, keyword}, callback) =>{
            let resp = { ok: false, message: 'Error al agregar la palabra clave.' };
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                let newKeywords = [...design.keywords];
                if(newKeywords.includes(keyword)) return callback({ ok: false, message: 'La palabra clave ya existe.' });
                newKeywords = [...newKeywords, keyword];
                const newDesign = await Design.findByIdAndUpdate(designId, {keywords: newKeywords}, {new: true});
                if (newDesign) {
                    design.keywords = newKeywords;
                    io.to(designId).emit('add-design-keyword', keyword);
                    return callback({ ok: true, message: 'Palabra clave agregada con éxito.'});
                } else {
                    return callback(resp);
                }
            } catch (error) {
                console.log(error);
                return callback(resp);
            }
        });

        socket.on('remove-design-keyword', async({designId, keyword}, callback) =>{
            let resp = { ok: false, message: 'Error al eliminar la palabra clave.' };
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                let newKeywords = [...design.keywords];
                newKeywords = newKeywords.filter( k => k !== keyword );
                const newDesign = await Design.findByIdAndUpdate(designId, {keywords: newKeywords}, {new: true});
                if (newDesign) {
                    design.keywords = newKeywords;
                    io.to(designId).emit('remove-design-keyword', keyword);
                    return callback({ ok: true, message: 'Palabra clave eliminada con éxito.'});
                } else {
                    return callback(resp);
                }
            } catch (error) {
                console.log(error);
                return callback(resp);
            }
        });

        socket.on('generate-new-share-link', async({ designId }, callback) =>{
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                const newLink = uuidv4();
                const newDesign = await Design.findByIdAndUpdate(designId, { readOnlyLink: newLink }, {new: true});
                if (newDesign) {
                    design.readOnlyLink = newLink;
                    io.to(designId).emit('change-read-only-link', newLink);
                    return callback({ ok: true, message: 'Nuevo enlace generado con éxito.' });
                } else return callback({ ok: false, message: 'Error al generar el nuevo enlace.' });
            } catch (error) {
                console.log(error);
                return callback({ ok: false, message: 'Error al generar el nuevo enlace.' });
            }
        });

        socket.on('rate-design', async ({ designId, rate }, callback) =>{
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                const existentAssesment = design.assessments.find((r, i) => r.user.toString() === rate.user);
                const index = design.assessments.indexOf(existentAssesment);
                if(existentAssesment && index !== -1) design.assessments[index].score = rate.score;
                else design.assessments.push(rate);
                let sum = 0;
                design.assessments.forEach((r) => sum += r.score);
                const mean = sum / design.assessments.length;
                design.metadata.scoreMean = mean;
                await Design.findByIdAndUpdate(designId, { 'metadata.scoreMean': design.metadata.scoreMean, assessments: design.assessments });
                const designs = await Design.find({ owner: design.owner});
                let userScoreSum = 0;
                designs.forEach(d => userScoreSum += d.metadata.scoreMean);
                let userScoreMean = userScoreSum / designs.length;
                userScoreMean = Math.round((userScoreMean + Number.EPSILON) * 10) / 10;
                await User.findByIdAndUpdate(design.owner, { scoreMean: userScoreMean });
                io.to(designId).emit('update-design-rate', { assessments: design.assessments, mean });
                return callback({ ok: true, message: 'Diseño valorado con éxito.' });
            } catch (error) {
                console.log(error);
                return callback({ ok: false, message: 'Error al registrar o cambiar valoración.' });
            }
        });

        socket.on('comment-design', async({ designId, commentary }, callback) =>{
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                if (!commentary._id) design.comments.push(commentary);
                else {
                    const existentCommentary = design.comments.find(c => c._id.toString() === commentary._id.toString());
                    const index = design.comments.indexOf(existentCommentary);
                    design.comments[index].commentary = commentary.commentary;
                }
                await Design.findByIdAndUpdate(designId, { comments: design.comments });
                io.to(designId).emit('comment-design', commentary._id ? commentary : design.comments[design.comments.length - 1]);
                return callback({ ok: true, message: `Comentario ${commentary._id ? 'editado' : 'registrado'} con éxito.`});
            } catch (error) {
                console.log(error);
                return callback({ ok: false, message: 'Error al registrar o editar el comentario.'});
            }
        });

        socket.on('delete-comment', async({ designId, commentaryId }, callback) =>{
            let resp = { ok: false, message: 'Error al eliminar el comentario.' };
            try {
                let designRoom = designRooms.getDesignRoomById( designId );
                let design = designRoom.design;
                design.comments = design.comments.filter(c => c._id.toString() !== commentaryId.toString());
                const updatedDesign = await Design.findByIdAndUpdate(designId, { comments: design.comments }, { new: true });
                if(!updatedDesign) return callback(resp);
                io.to(designId).emit('delete-comment', commentaryId);
                return callback({ ok: true, message: 'Comentario eliminado con éxito.' });
            } catch (error) {
                console.log(error);
                return callback(resp);
            }
        });
    });
};

module.exports = socketsConfig;