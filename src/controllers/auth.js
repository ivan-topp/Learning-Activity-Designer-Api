const {response} = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {successResponse, badRequest, internalServerError} = require('../utils/responses'); 
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

module.exports={
    LoginUser
}