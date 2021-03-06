const { response } = require('express');
const BloomCategory = require('../models/BloomCategory');
const { successResponse, internalServerError } = require('../utils/responses');

const getBloomCategories = async (req, res = response)=>{
    try {
        const bloomCategories = await BloomCategory.find().sort('-_id');
        return successResponse('Categorías de bloom obtenidas con éxito', { bloomCategories }, res);
    } catch (error) {
        internalServerError('Porfavor hable con el administrador', res)
    }
};

module.exports = {
    getBloomCategories
};