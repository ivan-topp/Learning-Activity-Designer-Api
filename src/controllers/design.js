const { response } = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Folder = require('../models/Folder');
const Design = require('../models/Design');
const { successResponse, badRequest, internalServerError, createdSuccessful, unauthorized } = require('../utils/responses');

const getRecentDesigns = async (req, res = response)=>{ 
    const { uid } = req;
    try {
        const designs = await Design.find({ privileges: { $elemMatch: { user: uid, type: 0 } } })
            .sort({updatedOn:-1})
            .limit(5)
            .populate('metadata.category')
            .populate('owner', 'name lastname');
        return successResponse('Diseños recientes obtenidos con éxito.', designs, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

const getUserDesignsAndForldersByPath = async (req, res = response)=>{
    const { uid } = req;
    const { path, from, limit } = req.body;
    if(!uid) return badRequest('No se ha especificado un usuario.', res);
    if(!path) return badRequest('No se ha especificado un carpeta.', res);
    try {
        const folder = await Folder.findOne({ path, owner: uid });
        const folders = await Folder.find({ parent: folder.id, owner: uid });
        const designs = await Design.find({ owner: uid, folder: folder.id })
            .skip(from || 0)
            .limit(limit || 12)
            .populate('metadata.category')
            .populate('owner', 'name lastname')
            .populate('folder', 'owner path parent');
        return successResponse('Diseños obtenidos con éxito.', { folders, designs }, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

const getDesignsSharedWithUser = async (req, res = response)=>{ 
    return successResponse('getDesignsSharedWithUser: Connected!!', ['Design#1', 'Design#2', 'Design#3'], res);
}

const deleteDesign = async (req, res = response) => {
    const { uid } = req;
    const id = req.params.id;
    if(!id) return badRequest('No se ha especificado un diseño.', res);
    try {
        const design = await Design.findById( id );
        if(design.owner.toString() !== uid) return unauthorized('Usted no está autorizado para eliminar este diseño.', res);
        const deleted = await Design.findByIdAndDelete( id );
        return successResponse('Se ha eliminado el diseño con éxito.', deleted, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

module.exports = {
    getRecentDesigns,
    getUserDesignsAndForldersByPath,
    getDesignsSharedWithUser,
    deleteDesign,
};
