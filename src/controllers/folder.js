const { response } = require('express');
const Folder = require('../models/Folder');
const { successResponse, badRequest, internalServerError, createdSuccessful } = require('../utils/responses');

// TODO: eliminar de forma recursiva los directorios
const deleteFolder = async (req, res = response) => {
    const { uid } = req;
    const id = req.params.id;
    if(!id) return badRequest('No se ha especificado un carpeta.', res);
    try {
        const folder = await Folder.findById( id );
        if(folder.owner.toString() !== uid) return unauthorized('Usted no está autorizado para eliminar esta carpeta.', res);
        const deleted = await Folder.findByIdAndDelete( id );
        return successResponse('Se ha eliminado la carpeta con éxito.', deleted, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

const getFoldersByPath = async (req, res = response) => {
    const { uid } = req;
    const { path } = req.body;
    if (!path) return badRequest('No se ha especificado una ruta de carpeta.', res);
    try {
        const folder = await Folder.findOne({ path, owner: uid });
        if(!folder) return badRequest('Carpeta no encontrada.', res);
        const folders = await Folder.find({ parent: folder.id, owner: uid });
        return successResponse('Carpetas obtenidos con éxito.', folders, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

module.exports = {
    deleteFolder,
    getFoldersByPath,
};
