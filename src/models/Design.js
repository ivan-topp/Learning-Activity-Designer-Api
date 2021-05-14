const { Schema, model } = require('mongoose');

const PrivilegeSchema = Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: Number, required: true },
}, {
    _id : false,
});

const AssessmentSchema = Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true },
},{
    _id : false,
});

const TaskSchema = Schema({
    id: { type: Schema.Types.ObjectId, required: true},
    description: { type: String, required: true },
    duration: { type: {
        hours: { type: Number, required: true },
        minutes: { type: Number, required: true },
    } },
    learningType: { type: String, required: true },
    format: { type: String, required: true },
    modality: { type: String, required: true },
    resourseLinks: { type: [{
        title: { type: String, required: true },
        link: { type: String, required: true },
    }] },
    groupSize:{ type: Number },
}, {
    _id : false,
});

const LearningActivitySchema = Schema({
    id: { type: Schema.Types.ObjectId, required: true},
    title: { type: String, required: true },
    description: { type: String, required: true },
    learningResults: { type: [{
        category: { type: {
            _id: { type: String, required: true},
            name: { type: String, required: true},
        }, required: true },
        verb: { type: String, required: true },
        description: { type: String, required: true },
    }], required: true },
    tasks: { type: [TaskSchema], required: true },
    evaluation: { type: [{
        type: { type: String, required: true },
        description: { type: String, required: true },
    }] },
}, {
    _id : false,
});

const DesignSchema = Schema({
    folder: { type: Schema.Types.ObjectId, ref: 'Folder' },
    metadata: { type: { 
        name: { type: String, required: true },
        category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
        workingTimeDesign: { type: {
            hours: { type: Number },
            minutes: { type: Number },
        }, required: true },
        workingTime: { type: {
            hours: { type: Number },
            minutes: { type: Number },
        }, required: true },
        classSize: { type: Number, required: true },
        priorKnowledge: { type: String, required: true },
        description: { type: String, required: true },
        objetive: { type: String, required: true },
        isPublic: { type: Boolean, required: true },
        scoreMean: { type: Number, required: true },
        results: { type: [{
            category: { type: {
                    _id: { type: String, required: true},
                    name: { type: String, required: true},
            }, required: true},
            verb: { type: String, required: true },
            description: { type: String, required: true },
        }], required: true },
        evaluation: { type: String, required: true },
        evaluationPattern: { type: String, required: true },
    }, required: true },
    data: { type: {
        learningActivities: { type: [LearningActivitySchema], required: true }
    }, required: true },
    comments: { type: [{
        commentary: { type: String, required: true },
        date: { type: Date, required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    }], required: true },
    assessments: { type: [AssessmentSchema], required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    origin: { type: Schema.Types.ObjectId, ref: 'Design' },
    privileges: { type: [PrivilegeSchema], required: true },
    readOnlyLink: { type: String, required: true },
    keywords: { type: [String], required: true },
}, {
    timestamps: true,
});

DesignSchema.methods.toJSON = function () {
    const doc = this;
    const obj = doc.toObject();
    delete obj.__v;
    return obj;
}

module.exports = model('Design', DesignSchema, 'designs');