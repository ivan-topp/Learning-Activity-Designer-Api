const { response } = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Folder = require('../models/Folder');
const { successResponse, badRequest, internalServerError, createdSuccessful } = require('../utils/responses'); 
const { generateJWT } = require('../utils/jwt');

const login = async(req, res = response)=>{ 
    const {email, password} = req.body;
    if(!email) return badRequest('El correo es requerido.', res);
    if(!password) return badRequest('La password es requerida.', res);
    try {
        const user = await User.findOne({email:email});
        if(!user) return badRequest('Email o contraseña incorrecto.', res);
        const validPassword = bcrypt.compareSync(password, user.password);
        if(!validPassword) return badRequest('Email o contraseña incorrecto.', res);
        const token = await generateJWT(user.id, user.name, user.lastname);
        return successResponse('Usuario Logeado', {
            user: {
                uid: user.id,
                name: user.name,
                lastname: user.lastname,
            }, 
            token
        }, res);
    } catch (error) {
        internalServerError('Porfavor hable con el administrador', res)
    }
}

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
        const rootUserFolder = Folder({
            owner: user.id,
            path: '/',
        });
        await rootUserFolder.save();
        const token = await generateJWT( user.id, user.name, user.lastname );
        createdSuccessful('Usuario creado satisfactoriamente.', {
            user: {
                uid: user.id,
                name: user.name,
                lastname: user.lastname,
            }, 
            token
        }, res);
    } catch (error) {
        internalServerError('Por favor hable con el administrador.', res);
    }
};

const renewToken = async (req, res = response) => {
    const { uid, name, lastname } = req;
    const token = await generateJWT(uid, name, lastname);
    successResponse('Token renovado con éxito.', {
        user: {
            uid,
            name,
            lastname,
        }, 
        token
    }, res);
};

module.exports = {
    register,
    login,
    renewToken
};
