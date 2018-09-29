const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { required } = require('../../config.json').MONGO;

const BatchSchema = new Schema({
	code: String,
	description: String,
	students: [Schema.Types.ObjectId]
});

const CourseSchema = new Schema({
	code: { type: String, required },
	fees: { type: Number, required },
	gstPercentage: { type: Number, min: 0, max: 100 },
	description: String,
	isActive: { type: Boolean, default: true },
	batches: [BatchSchema]
});

module.exports = CourseSchema;
