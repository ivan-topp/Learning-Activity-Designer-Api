const {response} = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {successResponse, badRequest, internalServerError, createdSuccessful} = require('../utils/responses'); 
const { generateJWT } = require('../utils/jwt');

const LoginUser = async(req, res = response)=>{ 
    
    const {email, password} = req.body;
    if(!email){badRequest('El correo es requerido', res)}
    if(!password){badRequest('La password es requerida', res)}
    
    try {
        const user = await User.findOne({email:email});
    
        if(!user){
            return badRequest('El usuario no existe con ese email', res);
        }
        const validPassword = bcrypt.compareSync(password, user.password);
        
        if(!validPassword){
            return badRequest('password incorrecto', res);
        }
        
        const token = await generateJWT(user.id, user.name);
        return successResponse('Usuario Logeado', {user, token}, res)
        

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
        const token = await generateJWT( user.id, user.name );
        createdSuccessful('Usuario creado satisfactoriamente.', { user, token }, res);
    } catch (error) {
        console.log(error);
        internalServerError('Por favor hable con el administrador.', res);
    }
};

module.exports = {
    register,
    LoginUser

};
