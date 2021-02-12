const {response} = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { badRequest, internalServerError, successResponse } = require('../utils/responses');

const getUserProfile = async(req, res = response)=>{
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
const searchOtherUserProfile = async(req, res = response)=>{
    const { name } = req.body;
    try {
        const user = await User.findOne( {name:name} );
        if(!user) return badRequest('Usuario no encontrado.', res); 
        return successResponse('Usuario encontrado.', { user:{
            uid: user.id,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
        } }, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
}

module.exports = {
    getUserProfile,
    searchOtherUserProfile,
}