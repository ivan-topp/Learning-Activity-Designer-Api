const { Schema, model } = require('mongoose');

const BloomVerbSchema = Schema({
    name: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'BloomCategory', required: true },
});

BloomVerbSchema.methods.toJSON = function () {
    const doc = this;
    const obj = doc.toObject();
    delete obj.__v;
    return obj;
}

module.exports = model('BloomVerb', BloomVerbSchema, 'bloom_verbs');