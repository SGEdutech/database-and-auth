const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { required } = require('../../config.json').MONGO;

const BatchSchema = new Schema({
	name: String,
	description: String,
	students: [Schema.Types.ObjectId]
});

const CourseSchema = new Schema({
	name: { type: String, required },
	fees: { type: Number, required },
	description: String,
	isActive: { type: Boolean, default: true },
	batches: [BatchSchema]
});

module.exports = CourseSchema;
