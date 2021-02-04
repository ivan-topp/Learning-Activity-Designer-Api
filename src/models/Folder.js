const { Schema, model } = require('mongoose');

const FolderSchema = Schema({
    parent: { type: Schema.Types.ObjectId, ref: 'Folder' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    path: { type: String, required: true }
});

FolderSchema.methods.toJSON = function () {
    const doc = this;
    const obj = doc.toObject();
    delete obj.__v;
    return obj;
}

module.exports = model('Folder', FolderSchema, 'folders');