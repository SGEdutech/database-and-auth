const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;
const CourseModel = require('./course');

const BatchSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    courseId: { type: mongoose.Types.ObjectId, required: true },
    students: [{ type: mongoose.Types.ObjectId, ref: 'user' }],
});

BatchSchema.pre('validate', next => {
    CourseModel.findOne({ _id: doc.courseId }).then(() => next()).catch(err => next(err));
});

BatchSchema.post('save', (batchAdded, next) => {
    CourseModel.findOne({ _id: batchAdded.courseId }).then(result => {
        result.batch.push(batchAdded._id);
        result.save();
    })
});

const Batch = mongoose.model('batch', BatchSchema);

module.exports = Batch;
