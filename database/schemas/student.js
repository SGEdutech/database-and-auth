const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { required } = require('../../config.json').MONGO;

const PaymentSchema = new Schema({
	courseId: Schema.Types.ObjectId,
	batchId: Schema.Types.ObjectId,
	discountAmount: Number,
	discountReason: String,
	feeCollected: Number,
	modeOfPayment: String,
	bank: String,
	dateOfCheck: String,
	checkNumber: String,
	cardNumber: String,
	transactionId: String,
	nextInstallment: Date
});

const StudentSchema = new Schema({
	eduatlasId: String,
	rollNumber: { type: String, required },
	name: { type: String, required },
	email: { type: String, required },
	address: String,
	contactNumber: String,
	payments: [PaymentSchema]
});

module.exports = StudentSchema;
