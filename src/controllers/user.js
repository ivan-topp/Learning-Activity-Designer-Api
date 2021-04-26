const {response} = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendEmail } = require('../services/email/email');
const templates = require('../services/email/templates');
const { badRequest, internalServerError, successResponse } = require('../utils/responses');
const { caseAndAccentInsensitive } = require('../utils/text');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const getUser = async(req, res = response)=>{
    const uid = req.params.uid;
    try {
        if (!mongoose.Types.ObjectId.isValid(uid)) return badRequest('No existe usuario con la id especificada.', res);
        const user = await User.findById( uid )
            .populate('contacts');
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
        const mainFilter = [];
        filter.split(' ').forEach(word => {
            if(word.trim().length) {
                mainFilter.push(...[
                    { 'name': {'$regex' : `.*${caseAndAccentInsensitive(word)}.*`, '$options' : 'i'} },
                    { 'lastname': {'$regex' : `.*${caseAndAccentInsensitive(word)}.*`, '$options' : 'i'} },
                    { 'email': {'$regex' : `.*${caseAndAccentInsensitive(word)}.*`, '$options' : 'i'} },
                    { 'city': {'$regex' : `.*${caseAndAccentInsensitive(word)}.*`, '$options' : 'i'} },
                    { 'country': {'$regex' : `.*${caseAndAccentInsensitive(word)}.*`, '$options' : 'i'} },
                ]);
            }
        });
        const numOfUsers = await User.aggregate([{ $match: mainFilter.length ? { $or: mainFilter } : {} }, {$count: "users"}]);
        const users = await User.aggregate([
            { $match: mainFilter.length ? { $or: mainFilter } : {} }, 
            {$skip: from }, 
            {$limit: limit},
            { $sort: { "name": 1, "lastname": 1 } }]);
        const nPages = numOfUsers.length ? Math.ceil(numOfUsers[0].users / limit) : 0;
        return successResponse('Usuarios obtenidos correctamente.', { users, from: from + limit, nPages }, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
};

const addNewContact = async(req, res = response) =>{
    const newUserId = req.params.uid;
    const { uid } = req;
    try {
        const user = await User.findById( uid );
        if(!user) return badRequest('El usuario no existe', res);
        if(!newUserId) return badRequest('El usuario que quiere agregar no existe', res);
        let contacts = [...user.contacts];
        if(contacts.length > 0){
            const isInContacts = contacts.map(contact=>contact==newUserId).reduce(( a,b ) => a || b);
            if(isInContacts) return badRequest('El usuario ya existe en la lista de contactos', res);
        }
        contacts = [...user.contacts, newUserId];
        await User.findByIdAndUpdate(uid, { contacts }, { rawResult:true });
        return successResponse('Usuario agregado.', newUserId, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
};

const updateUser = async( req, res=response ) => {
    const { uid } = req;
    const {newData} = req.body;
    try {
        let user = await User.findById( uid );
        console.log(newData, uid)
        if(!user) return badRequest('El usuario no existe', res);
        if(!newData) return badRequest('Datos nuevos no especificados', res);
        user = await User.findByIdAndUpdate(uid, newData, { rawResult: true });
        return successResponse('Usuario actualizado correctamente', user, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
};

const removeContactFromArray = ( arrayContacs, pos ) => {
    arrayContacs.splice( pos, 1);
};

const deleteContact = async(req, res = response) =>{
    const deleteUserId = req.params.uid;
    const { uid } = req;
    try {
        const user = await User.findById( uid );
        if(!user) return badRequest('El usuario no existe', res);
        if(!deleteUserId) return badRequest('El usuario que quiere eliminar no existe', res);
        let contacts = [...user.contacts];
        console.log('Entrada ' + contacts);
        let posContact = 0;
        if(contacts.length > 0){
            const isInContacts = contacts.map(contact=>contact==deleteUserId).reduce(( a, b, i ) => (a || b && (posContact=i)));
            console.log(posContact);
            if(!isInContacts) return badRequest('El usuario que desea eliminar no esta dentro de sus contactos', res);
            if(isInContacts)  removeContactFromArray(contacts, posContact);
        }
        console.log('Salida ' + contacts);
        await User.findByIdAndUpdate(uid, { contacts }, { rawResult:true });
        return successResponse('Usuario eliminado de sus contactos', deleteUserId, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
};

const getUserByEmail = async (req, res = response) => {
    const { email } = req.body;
    if(!email) return badRequest('No se ha especificado dirección de correo electrónico', res);
    try {
        const user = await User.findOne({ email });
        if(!user) return badRequest('No existe usuario con el email ingresado.', res);
        let randomCode = uuidv4();
        randomCode = randomCode.substr(randomCode.length - 8).toUpperCase();
        await sendEmail(user.email, templates.verificationCode(randomCode));
        return successResponse('Usuario encontrado correctamente', { user, randomCode }, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
};

const resendVerificationCode = async (req, res = response) => {
    const { email } = req.body;
    if(!email) return badRequest('No se ha especificado dirección de correo electrónico', res);
    try {
        let randomCode = uuidv4();
        randomCode = randomCode.substr(randomCode.length - 8).toUpperCase();
        const emailSent = await sendEmail(email, templates.verificationCode(randomCode));
        if (!emailSent) return internalServerError('Ha ocurrido un error al intentar reenviar el correo. Por favor, intente de nuevo más tarde', res);
        return successResponse('Código reenviado con éxito', { randomCode }, res);
    } catch (error) {
        console.log(error);
        return internalServerError('Porfavor hable con el administrador.', res);
    }
};

module.exports = {
    addNewContact,
    deleteContact,
    updateUser,
    getUser,
    searchUsers,
    getUserByEmail,
    resendVerificationCode,
}