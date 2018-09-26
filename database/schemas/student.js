const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { required } = require('../../config.json').MONGO;

const StudentSchema = new Schema({
	eduatlasId: String,
	rollNumber: { type: String, required },
	name: { type: String, required },
	email: { type: String, required },
	address: String,
	contactNumber: String,
	courseName: String,
	discountAmount: String,
	discountReason: String,
	feeCollected: String,
	modeOfPayment: String,
	nextInstallment: Date
});

module.exports = StudentSchema;
