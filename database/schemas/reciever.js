const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecieverSchema = new Schema({
	userEmail: String,
	readAt: Date,
	createdAt: { type: Date, default: Date.now(), expires: 5 }
});

RecieverSchema.index({ createdAt: 1 })

module.exports = RecieverSchema;
