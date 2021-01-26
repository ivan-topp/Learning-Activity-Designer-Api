const { Schema, model } = require('mongoose');

const UserSchema = Schema({
    name: {type: String, required: true},
    lastname: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    occupation: {type: String, required: true},
    scoreMean: {type: Number, required: true},
    institution: {type: String, required: true},
    country: {type: String, required: true},
    city: {type: String, required: true},
    description: {type: String, required: true},
    contacts: {type: [{type: Schema.Types.ObjectId, ref: 'User'}], required: true},
    createdOn: {type: Date, required: true},
    updatedOn: {type: Date, required: true},
});

module.exports = model('User', UserSchema);