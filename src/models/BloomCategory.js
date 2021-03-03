const { Schema, model } = require('mongoose');

const BloomCategorySchema = Schema({
    name: { type: String, required: true },
});

BloomCategorySchema.methods.toJSON = function () {
    const doc = this;
    const obj = doc.toObject();
    delete obj.__v;
    return obj;
}

module.exports = model('BloomCategory', BloomCategorySchema, 'bloom_categories');