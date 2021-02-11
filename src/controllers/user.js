const {response} = require('express');
const User = require('../models/User');
const { badRequest, internalServerError, successResponse } = require('../utils/responses');

const getUserProfile = async(req, res = response)=>{
    const uid = req.params.uid;
    try {
        const user = await User.findById( uid );
        console.log('Usuario '+ user);
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
        console.log('Usuario '+ user);
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