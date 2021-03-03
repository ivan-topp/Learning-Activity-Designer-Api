const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { dbConnection } = require('../src/config/database');
const BloomCategory = require('../src/models/BloomCategory');
const BloomVerb = require('../src/models/BloomVerb');
const verbs = require('./verbs.json');
require('dotenv').config();

dbConnection().then(async () => {
    let count = verbs.length;
    let verbsLoaded = 0;
    console.log('Cargando Verbos...');
    try {
        const bloomCategories = await BloomCategory.find({});
        await BloomVerb.deleteMany();
        for (const verb of verbs) {
            const verbName = verb.verb.charAt(0).toUpperCase() + verb.verb.slice(1);
            const bloomCategory = bloomCategories.find((bloomCategory) => bloomCategory.name === verb.category);
            const bloomVerb = new BloomVerb({ name: verbName, category: mongoose.Types.ObjectId(bloomCategory._id)});
            const newBloomVerb = await bloomVerb.save({ new: true });
            if(!newBloomVerb) console.log('Error al cargar el verbo: ', verbName);
            else verbsLoaded += 1;
        }
        console.log('------------------------------------');
        console.log('            Carga de Verbos         ');
        console.log('------------------------------------');
        console.log('Verbos totales a cargar: ', count);
        console.log('Verbos cargados con éxito: ', verbsLoaded);
        console.log('------------------------------------');
    } catch (error) {
        console.log('Error al cargar los verbos');
        console.log(error);
    }
});