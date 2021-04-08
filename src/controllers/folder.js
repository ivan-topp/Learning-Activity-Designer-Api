const { response } = require('express');
const mongoose = require('mongoose');
const Design = require('../models/Design');
const Folder = require('../models/Folder');
const { successResponse, badRequest, internalServerError, createdSuccessful, unauthorized } = require('../utils/responses');

const getFoldersByPath = async (req, res = response) => {
    const { uid } = req;
    const { path } = req.body;
    if (!path) return badRequest('No se ha especificado una ruta de carpeta.', res);
    try {
        const folder = await Folder.findOne({ path, owner: uid });
        if (!folder) return badRequest('Carpeta no encontrada.', res);
        const folders = await Folder.find({ parent: folder.id, owner: uid });
        return successResponse('Carpetas obtenidos con éxito.', folders, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

const createFolder = async (req, res = response) => {
    const { uid } = req;
    const { path, folderName } = req.body;
    if (!path) return badRequest('No se ha especificado una ruta de carpeta.', res);
    if (!folderName || (folderName && folderName.trim().length === 0)) return badRequest('No se ha especificado un nombre para la carpeta.', res);
    if (folderName.trim() === '/' || folderName.trim().toLowerCase() === 'mis diseños') return badRequest('Nombre no permitido para la carpeta.', res);
    try {
        const parentFolder = await Folder.findOne({ path, owner: uid });
        if (!parentFolder) return badRequest('Carpeta padre no encontrada.', res);
        const newPath = (path === '/') ? path + folderName : path + '/' + folderName;
        const folderExists = await Folder.findOne({ path: newPath, owner: uid, name: folderName });
        if (folderExists) return badRequest(`Ya existe una carpeta en este directorio con el nombre "${folderName}".`, res);
        const folder = new Folder({
            parent: parentFolder._id,
            owner: uid,
            path: newPath,
            name: folderName,
        });
        await folder.save();
        return successResponse('Carpeta creada con éxito.', folder, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

const renameFolder = async (req, res = response) => {
    const { uid } = req;
    const { id } = req.params;
    const { name } = req.body;
    if (!id) return badRequest('No se ha especificado una carpeta.', res);
    if (!mongoose.Types.ObjectId.isValid(id)) return badRequest('No existe carpeta con la id especificada.', res);
    if (!name || (name && name.trim().length === 0)) return badRequest('No se ha especificado nuevo nombre de carpeta.', res);
    if (name.trim() === '/' || name.trim().toLowerCase() === 'mis diseños') return badRequest('Nombre no permitido para la carpeta.', res);
    try {
        let folder = await Folder.findById(id);
        if (!folder) return badRequest('Carpeta no encontrada.', res);
        if (folder.owner != uid) return unauthorized('Usted no tiene permisos para realizar acciones en la carpeta especificada.', res);
        const newPath = folder.path.replace(folder.name, name.trim());
        const folderExists = await Folder.findOne({ path: newPath, owner: uid, name: name.trim() });
        if (folderExists) return badRequest(`Ya existe una carpeta en este directorio con el nombre "${name.trim()}".`, res);
        await Folder.updateMany(
            {
                owner: mongoose.Types.ObjectId(uid),
                path: { $regex: `.*${folder.path}.*` },
            },
            [{
                $set: {
                    path: {
                        $replaceOne: { input: "$path", find: folder.path, replacement: newPath }
                    }
                }
            }]
        );
        folder.name = name;
        folder.path = newPath;
        folder = await folder.save();
        return successResponse('Nombre de carpeta cambiado con éxito.', { folder }, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
};

const deleteFolder = async (req, res = response) => {
    const { uid } = req;
    const { id } = req.params;
    if (!id) return badRequest('No se ha especificado una carpeta.', res);
    if (!mongoose.Types.ObjectId.isValid(id)) return badRequest('No existe carpeta con la id especificada.', res);
    try {
        let folder = await Folder.findById(id);
        if (!folder) return badRequest('Carpeta no encontrada.', res);
        if (folder.owner != uid) return unauthorized('Usted no tiene permisos para realizar acciones en la carpeta especificada.', res);
        const targetFolderIds = await getIdsRecursivelyById(id, Folder, 'parent');
        const targetDesignIds = await Design.find({folder: {$in: targetFolderIds}});
        await Design.deleteMany({folder: {$in: targetFolderIds}});
        await Folder.deleteMany({
            _id: {
              $in: targetFolderIds
            }
        });
        return successResponse('Carpeta eliminada con éxito.', { deletedFolders: targetFolderIds.length, targetFolderIds, deletedDesigns: targetDesignIds.length, targetDesignIds }, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
};

const getIdsRecursivelyById = async (id, Model, field) => {
    const ids = [];
    ids.push(id.toString());
    var children = await Model.find({ [field]: id });
    for (const child of children) {
        const result = await getIdsRecursivelyById(child._id, Model, field);
        ids.push(...result);
    }
    return ids;
}

module.exports = {
    deleteFolder,
    getFoldersByPath,
    createFolder,
    renameFolder
};
