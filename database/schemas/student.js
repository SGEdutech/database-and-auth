const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { required } = require('../../config.json').MONGO;

const InstallmentSchema = new Schema({
	feeCollected: Number,
	modeOfPayment: String,
	bank: String,
	dateOfCheck: Date,
	checkNumber: String,
	cardNumber: String,
	transactionId: String,
	nextInstallment: Date,
	createdAt: { type: Date, default: Date.now }
});

const PaymentSchema = new Schema({
	courseName: String,
	courseFee: Number,
	discountAmount: Number,
	discountReason: String,
	nextInstallmentDate: Date,
	installments: [InstallmentSchema]
});

const StudentSchema = new Schema({
	eduatlasId: String,
	rollNumber: { type: String, lowercase: true, required },
	name: { type: String, lowercase: true, required },
	email: { type: String, lowercase: true, required },
	address: String,
	contactNumber: String,
	payments: [PaymentSchema]
});

module.exports = StudentSchema;
