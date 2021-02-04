const { Schema, model } = require('mongoose');

const CategorySchema = Schema({
    name: { type: String, required: true },
});

CategorySchema.methods.toJSON = function () {
    const doc = this;
    const obj = doc.toObject();
    delete obj.__v;
    return obj;
}

module.exports = model('Category', CategorySchema, 'categories');