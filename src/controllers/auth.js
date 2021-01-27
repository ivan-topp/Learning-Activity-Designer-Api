const { response } = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateJWT } = require('../utils/jwt');
const { badRequest, createdSuccessful, internalServerError } = require('../utils/responses');

const register = async (req, res = response) => {
    const { name, lastname, email, password } = req.body;
    if(!name) return badRequest('El nombre es requerido.', res);
    if(!lastname) return badRequest('El apellido es requerido.', res);
    if(!email) return badRequest('El email es requerido.', res);
    if(!password) return badRequest('El password es requerido.', res);
    try {
        let user = await User.findOne({ email });
        if(user) return badRequest('Ya existe un usuario con ese correo.', res);
        req.body.scoreMean = 0;
        req.body.createdOn = Date.now();
        req.body.updatedOn = Date.now();
        user = new User(req.body);
        const salt = bcrypt.genSaltSync();
        user.password = bcrypt.hashSync(password, salt);
        await user.save();
        const token = await generateJWT( user.id, user.name );
        createdSuccessful('Usuario creado satisfactoriamente.', { user, token }, res);
    } catch (error) {
        console.log(error);
        internalServerError('Por favor hable con el administrador.', res);
    }
};

module.exports = {
    register,
};