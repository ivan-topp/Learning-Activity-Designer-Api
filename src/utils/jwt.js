const jwt = require('jsonwebtoken');

const generateJWT = ( uid, name, lastname ) => {
    return new Promise ((resolve, reject) => {
        const payload = { uid, name, lastname };
        jwt.sign(payload, process.env.SECRET_JWT_SEED, {
            expiresIn: '2h'
        }, (err, token) => {
            if(err){
                console.log(err)
                reject('No se pudo generar el token');
            }

            resolve(token);
        });
    });
};

module.exports = {
    generateJWT
};
