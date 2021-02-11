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

module.exports = {
    deleteFolder
};
