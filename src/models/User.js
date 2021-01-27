const { Schema, model } = require('mongoose');

const UserSchema = Schema({
    name: {type: String, required: true},
    lastname: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    occupation: {type: String},
    scoreMean: {type: Number, required: true},
    institution: {type: String},
    country: {type: String},
    city: {type: String},
    description: {type: String},
    contacts: {type: [{type: Schema.Types.ObjectId, ref: 'User'}]},
    createdOn: {type: Date, required: true},
    updatedOn: {type: Date, required: true},
});

module.exports = model('User', UserSchema);