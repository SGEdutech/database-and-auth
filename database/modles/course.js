const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
    name: { type: String, required: true },
    fees: { type: Number, required:true },
    description: String,
    listingId: { type: mongoose.Types.ObjectId, required: true },
    batch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'batch' }]
});

const Course = mongoose.model('course', CourseSchema);

module.exports = Course;
