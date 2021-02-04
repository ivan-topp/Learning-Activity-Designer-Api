const { Schema, model } = require('mongoose');

const UserSchema = Schema({
    name: {type: String, required: true},
    lastname: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    occupation: { type: String },
    scoreMean: {type: Number, required: true},
    institution: { type: String },
    country: { type: String },
    city: { type: String },
    description: { type: String },
    contacts: { type: [{type: Schema.Types.ObjectId, ref: 'User'}] },
    createdOn: { type: Date, required: true },
    updatedOn: { type: Date, required: true },
});

UserSchema.methods.toJSON = function () {
    const doc = this;
    const obj = doc.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
}

module.exports = model('User', UserSchema, 'users');