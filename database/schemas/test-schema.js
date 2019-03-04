const mongoose = require('mongoose');
const { Schema } = mongoose;
const { required } = require('../../config.json').MONGO;

const ReportSchema = new Schema({
	studentId: { type: Schema.Types.ObjectId, required },
	// TODO: Validation
	marksObtained: { type: Number, required }
});

const TestSchema = new Schema({
	name: { type: String, lowercase: true, required },
	date: { type: Date, required },
	maxMarks: { type: Number, required },
	batcheIds: [Schema.Types.ObjectId],
	reports: [ReportSchema]
});

module.exports = TestSchema;
