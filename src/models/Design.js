const { Schema, model } = require('mongoose');

const DesignSchema = Schema({
    folder: { type: Schema.Types.ObjectId, ref: 'Folder' },
    metadata: { type: { 
        name: { type: String, required: true },
        category: { type: Schema.Types.ObjectId, ref: 'Category' },
        workingTimeDesign: { type: Number },
        workingTime: { type: Number },
        priorKnowledge: { type: String },
        description: { type: String },
        objetive: { type: String },
        public: { type: Boolean, required: true },
        scoreMean: { type: Number, required: true },
        results: { type: [{
            verb: { type: String, required: true },
            description: { type: String, required: true },
        }], required: true },
    }, required: true },
    data: { type: {
        tlas: { type: [{
            title: { type: String, required: true },
            description: { type: String, required: true },
            learningResults: { type: [{
                verb: { type: String, required: true },
                description: { type: String, required: true },
            }], required: true },
            activities: { type: [{
                description: { type: String, required: true },
                duration: { type: Number, required: true },
                learningType: { type: String, required: true },
                format: { type: String, required: true },
                modality: { type: String, required: true },
                resourseLinks: { type: [{
                    title: { type: String, required: true },
                    link: { type: String, required: true },
                }] },
            }], required: true },
        }], required: true }
    }, required: true },
    comments: { type: [{
        commentary: { type: String, required: true },
        date: { type: Date, required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    }], required: true },
    likes: { type: Number, required: true },
    dislikes: { type: Number, required: true },
    createdOn: { type: Date, required: true },
    updatedOn: { type: Date, required: true },
    assessments: { type: [{
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        score: { type: Number, required: true },
    }], required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    privileges: { type: [{
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: Number, required: true },
    }], required: true },
    keywords: { type: [String], required: true },
});

DesignSchema.methods.toJSON = function () {
    const doc = this;
    const obj = doc.toObject();
    delete obj.__v;
    return obj;
}

module.exports = model('Design', DesignSchema, 'designs');