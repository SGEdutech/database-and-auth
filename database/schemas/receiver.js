const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecieverSchema = new Schema({
	userEmail: String,
	readAt: Date
});

module.exports = RecieverSchema;
