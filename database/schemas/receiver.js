const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { required, select } = require('../../config.json').MONGO;

const RecieverSchema = new Schema({
	userEmail: { type: String, required },
	readAt: Date
});

module.exports = RecieverSchema;
