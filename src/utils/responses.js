const { response } = require('express');

const successResponse = (message, data, res = response) => {
    res.status(200).json({
        ok: true,
        message,
        data
    });
};

const createdSuccessful = (message, data, res = response) => {
    res.status(201).json({
        ok: true,
        message,
        data
    });
};

const badRequest = (message, res = response) => {
    res.status(400).json({
        ok: false,
        message
    });
};

const internalServerError = (message, res = response) => {
    res.status(500).json({
        ok: false,
        message
    });
};

module.exports = {
    successResponse,
    createdSuccessful,
    badRequest,
    internalServerError
};
