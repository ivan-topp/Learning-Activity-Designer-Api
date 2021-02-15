const {response} = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { badRequest, internalServerError, successResponse } = require('../utils/responses');

const getUser = async(req, res = response)=>{
    const uid = req.params.uid;
    try {
        if (!mongoose.Types.ObjectId.isValid(uid)) return badRequest('No existe usuario con la id especificada.', res);
        const user = await User.findById( uid );
        if(!user) return badRequest('Usuario no encontrado.', res); 
        return successResponse('Usuario encontrado.', user, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}
const searchUsers = async(req, res = response)=>{
    let { filter, from, limit } = req.body;
    from = from || 0;
    limit = limit || 12;
    try {
        if(!filter) return badRequest('Filtro de usuarios no especificado.', res);
        const numOfUsers = await User.countDocuments({ $text: { $search: filter } });
        const users = await User.find({ $text: { $search: filter } })
            .skip(from)
            .limit(limit);
        return successResponse('Usuarios obtenidos correctamente.', { users, from: from + limit, nPages: Math.ceil(numOfUsers / limit)}, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

module.exports = {
    getUser,
    searchUsers,
}