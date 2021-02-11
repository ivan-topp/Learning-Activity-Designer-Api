const { response } = require('express');
const jwt = require('jsonwebtoken');
const { unauthorized } = require('../utils/responses');

const validateJWT = (req, res = response, next) => {
    const token = req.header('x-token');
    if(!token){
        return unauthorized('No hay token en la petición.', res);
    }
    try {
        const { uid, name, lastname } = jwt.verify(
            token,
            process.env.SECRET_JWT_SEED
        );
        req.uid = uid;
        req.name = name;
        req.lastname = lastname;
    } catch (error) {
        return unauthorized('Token no válido.', res);
    }
    next();
};

module.exports = {
    validateJWT
};