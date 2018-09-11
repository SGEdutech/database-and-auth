const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
    name: { type: String, required: true },
    fees: { type: Number, required:true },
    description: String,
    listingId: { type: Schema.Types.ObjectId, required: true },
    batches: [{ type: Schema.Types.ObjectId, ref: 'batch' }]
});

const Course = mongoose.model('course', CourseSchema);

module.exports = Course;
