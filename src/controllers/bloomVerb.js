const { response } = require('express');
const BloomVerb = require('../models/BloomVerb');
const { successResponse, internalServerError } = require('../utils/responses');

const getBloomVerbs = async (req, res = response)=>{
    const { category } = req.body;
    let filter = {};
    try {
        if(category) filter = { category };
        const bloomVerbs = await BloomVerb.find(filter);
        return successResponse('Verbos de bloom obtenidos con éxito', { bloomVerbs }, res);
    } catch (error) {
        internalServerError('Porfavor hable con el administrador', res)
    }
};

module.exports = {
    getBloomVerbs
};