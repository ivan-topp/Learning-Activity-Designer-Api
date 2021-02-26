const { response } = require('express');
const Category = require('../models/Category');
const { successResponse, internalServerError } = require('../utils/responses');

const getCategories = async (req, res = response)=>{
    try {
        const categories = await Category.find();
        return successResponse('Categorías obtenidas con éxito', { categories }, res);
    } catch (error) {
        internalServerError('Porfavor hable con el administrador', res)
    }
};

module.exports = {
    getCategories
};