const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;
const CourseModel = require('./course');

const BatchSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    courseId: { type: mongoose.Schema.Types.ObjectId, required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]
});

BatchSchema.post('validate', doc => {
    return CourseModel.findOne({ _id: doc.courseId });
});

BatchSchema.post('save', batchAdded => {
    return new Promise((resolve, reject) => {
        CourseModel.findOne({ _id: batchAdded.courseId }).then(result => {
            result.batch.push(batchAdded._id);
            return result.save();
        }).then(() => resolve()).catch(err => reject(err));
    })
});

const Batch = mongoose.model('batch', BatchSchema);

module.exports = Batch;
