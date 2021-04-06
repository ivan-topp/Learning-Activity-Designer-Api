const { response } = require('express');
const User = require('../models/User');
const Folder = require('../models/Folder');
const Design = require('../models/Design');
const Category = require('../models/Category');
const { successResponse, badRequest, internalServerError, createdSuccessful, unauthorized } = require('../utils/responses');
const mongoose = require('mongoose');
const { caseAndAccentInsensitive } = require('../utils/text');

const getRecentDesigns = async (req, res = response) => {
    const { uid } = req;
    try {
        const designs = await Design.find({ privileges: { $elemMatch: { user: uid, type: 0 } } })
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate({ path: 'metadata.category', model: Category })
            .populate('owner', 'name lastname');
        return successResponse('Diseños recientes obtenidos con éxito.', designs, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

const getUserDesignsAndFoldersByPath = async (req, res = response) => {
    const { uid } = req;
    let { path, from, limit } = req.body;
    from = from || 0;
    limit = limit || 12;
    if (!uid) return badRequest('No se ha especificado un usuario.', res);
    if (!path) return badRequest('No se ha especificado un carpeta.', res);
    try {
        const folder = await Folder.findOne({ path, owner: uid });
        if (!folder) return badRequest('La carpeta especificada no existe.', res);
        const numOfDesigns = await Design.countDocuments({ owner: uid, folder: folder.id });
        const designs = await Design.find({ owner: uid, folder: folder.id })
            .skip(from)
            .limit(limit)
            .populate({ path: 'metadata.category', model: Category })
            .populate('owner', 'name lastname')
            .populate('folder', 'owner path parent');
        return successResponse('Diseños obtenidos con éxito.', { ownerId: uid, from: from + limit, nPages : Math.ceil(numOfDesigns / limit),  designs }, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

const getDesignsSharedWithUser = async (req, res = response) => {
    const { uid } = req;
    let { from, limit } = req.body;
    from = from || 0;
    limit = limit || 12;
    if (!uid) return badRequest('No se ha especificado un usuario.', res);
    try {
        const numOfDesigns = await Design.countDocuments({ owner: { $ne: uid}, privileges: { $elemMatch: { user: uid } } });
        const designs = await Design.find({ owner: { $ne: uid}, privileges: { $elemMatch: { user: uid } } })
            .skip(from)
            .limit(limit)    
            .sort({ updatedAt: -1 })
            .populate({ path: 'metadata.category', model: Category })
            .populate('owner', 'name lastname');
        return successResponse('Diseños obtenidos con éxito.', { ownerId: uid, from: from + limit, nPages : Math.ceil(numOfDesigns / limit),  designs }, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

const deleteDesign = async (req, res = response) => {
    const { uid } = req;
    const id = req.params.id;
    if (!id) return badRequest('No se ha especificado un diseño.', res);
    try {
        const design = await Design.findById(id);
        if (design.owner.toString() !== uid) return unauthorized('Usted no está autorizado para eliminar este diseño.', res);
        const deleted = await Design.findByIdAndDelete(id);
        return successResponse('Se ha eliminado el diseño con éxito.', deleted, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

const getPublicDesignsByUser = async (req, res = response) => {
    let { id, from, limit } = req.body;
    from = from || 0;
    limit = limit || 12;
    if (!id) return badRequest('No se ha especificado un usuario.', res);
    if (!mongoose.Types.ObjectId.isValid(id)) return badRequest('No existe usuario con la id especificada.', res);
    try {
        const user = User.findById(id);
        if (!user) return badRequest('No existe usuario con la id especificada.', res);
        const numOfDesigns = await Design.countDocuments({ owner: id, 'metadata.isPublic': true });
        const designs = await Design.find({ owner: id, 'metadata.isPublic': true })
            .skip(from)
            .limit(limit)
            .populate({ path: 'metadata.category', model: Category })
            .populate('owner', 'name lastname')
            .populate('folder', 'owner path parent');
        return successResponse('Se han obtenido con éxito los diseños públicos del usuario especificado.', { ownerId: id, from: from + limit, nPages : Math.ceil(numOfDesigns / limit), designs }, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
};

const updateTLADesing = async( req, res = response ) => {
    const { uid } = req;
    const id = req.params.id;
    const { title, description } =  req.body;
    console.log(title)
    if (!id) return badRequest('No se ha especificado un diseño.', res);
    try {
        let design = await Design.findById( id );
        console.log(design.owner)
        if (design.owner.toString() !== uid) return unauthorized('Usted no está autorizado para editar este diseño.', res);
        design = await Design.findByIdAndUpdate(id, title, { rawResult: true });
        return successResponse('TLA del diseño editado', id, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
};

const createDesign = async (req, res = response) => {
    const { uid } = req;
    let { path, isPublic } = req.body;
    if (!path) return badRequest('No se ha especificado un carpeta.', res);
    isPublic = isPublic !== null ? isPublic : false;
    try {
        const folder = await Folder.findOne({ path, owner: uid });
        if (!folder) return badRequest('No existe carpeta con la ruta especificada.', res);
        newDesign = {
            folder: folder._id,
            metadata: {
                name: 'Nuevo Diseño',
                isPublic: isPublic,
                public: false,
                scoreMean: 0,
                category: mongoose.Types.ObjectId('603428218fe538f505b5ac90'),
                results: [],
                workingTime: {
                    hours: 0,
                    minutes: 0,
                },
                classSize: 0,
            },
            data: {
                learningActivities: []
            },
            comments: [],
            assessments: [],
            owner: uid,
            privileges: [{
                user: mongoose.Types.ObjectId(uid),
                type: 0,
            }],
            keywords: [],
        };
        const design = new Design(newDesign);
        const designSaved = await design.save({ new: true });
        return createdSuccessful('Diseño creado con éxito', {design: designSaved}, res);
        
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
};

const getPublicFilteredDesigns = async (req, res = response) => {
    let { filter, keywords, categories, from, limit } = req.body;
    from = from || 0;
    limit = limit || 12;
    try {
        const keywordFilter = [];
        const categoriesFilter = [];
        const mainFilter = [];
        keywords.forEach(keyword => {
            keywordFilter.push({
                'keywords': { '$elemMatch': {'$regex' : `.*${caseAndAccentInsensitive(keyword)}.*`, '$options' : 'i'} }
            });
        });
        categories.forEach(category => {
            categoriesFilter.push({
                'metadata.category': mongoose.Types.ObjectId(category._id)
            });
        });
        filter.split(' ').forEach(word => {
            if(word.trim().length) {
                mainFilter.push(...[
                    { 'owner.name': {'$regex' : `.*${caseAndAccentInsensitive(word)}.*`, '$options' : 'i'} },
                    { 'owner.lastname': {'$regex' : `.*${caseAndAccentInsensitive(word)}.*`, '$options' : 'i'} },
                    { 'metadata.name': {'$regex' : `.*${caseAndAccentInsensitive(word)}.*`, '$options' : 'i'} },
                ]);
            }
        });
        const aggregation = [
            { $match: { $and: [
                { 'metadata.isPublic': true },
                ...keywordFilter,
                categoriesFilter.length ? { $or: categoriesFilter } : {},
            ] } },
            { $lookup: {
                'from': 'users',
                'let': {'ownerId': '$owner'}, 
                'pipeline': [
                    { $match: { "$expr": { "$eq": [ "$_id", "$$ownerId" ] } } },
                    { $project: { name: 1, lastname: 1, email: 1  }  },
                ],
                'as': 'owner',
            } },
            { $unwind: "$owner" },
            { $match: mainFilter.length ? { $or: mainFilter } : {} },
            { $lookup: {from: 'categories', localField: 'metadata.category', foreignField: '_id', as: 'metadata.category'} },
            { $unwind: "$metadata.category" },
            { $sort: { "metadata.scoreMean": -1, "updatedAt": -1 } },
        ];
        const numOfDesigns = await Design.aggregate([...aggregation, {$count: "designs"}]);
        const designs = await Design.aggregate([...aggregation, {$skip: from }, {$limit: limit}]);
        const nPages = numOfDesigns.length ? Math.ceil(numOfDesigns[0].designs / limit) : 0;
        return successResponse('Se han filtrado con éxito los diseños públicos.', { from: from + limit, nPages, designs }, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
};

module.exports = {
    getRecentDesigns,
    getUserDesignsAndFoldersByPath,
    getDesignsSharedWithUser,
    deleteDesign,
    getPublicDesignsByUser,
    updateTLADesing,
    createDesign,
    getPublicFilteredDesigns,
};
