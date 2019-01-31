const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { required } = require('../../config.json').MONGO;

const InstallmentSchema = new Schema({
	feeCollected: { type: Number, required },
	modeOfPayment: String,
	bank: String,
	dateOfCheque: Date,
	chequeNumber: String,
	cardNumber: String,
	transactionId: String,
	createdAt: { type: Date, default: Date.now }
});

const PaymentSchema = new Schema({
	courseId: Schema.Types.ObjectId,
	courseFee: { type: Number, required },
	taxAmount: Number,
	courseGstPercentage: { type: Number, default: 0 },
	discountAmount: Number,
	discountReason: String,
	nextInstallmentDate: Date,
	installments: [InstallmentSchema]
});

const StudentSchema = new Schema({
	rollNumber: { type: String, lowercase: true, required },
	name: { type: String, lowercase: true, required },
	email: { type: String, lowercase: true, required },
	address: String,
	contactNumber: String,
	payments: [PaymentSchema]
});

module.exports = StudentSchema;
