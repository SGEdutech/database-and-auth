const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;
const CourseModel = require('./course');

const BatchSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    courseId: { type: Schema.Types.ObjectId, required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'user' }]
});

BatchSchema.post('validate', doc => {
    return new Promise((resolve, reject) => {
        CourseModel.findOne({ _id: doc.courseId }).then(course => {
            if (course === null) {
                reject(new Error('No such course'));
            } else {
                resolve();
            }
        }).catch(err => reject(err));
    })
});

BatchSchema.post('save', batchAdded => {
    return new Promise((resolve, reject) => {
        CourseModel.findOne({ _id: batchAdded.courseId }).then(result => {
            result.batches.push(batchAdded._id);
            return result.save();
        }).then(() => resolve()).catch(err => reject(err));
    })
});

const Batch = mongoose.model('batch', BatchSchema);

module.exports = Batch;
