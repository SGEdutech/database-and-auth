const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { required, select } = require('../../config.json').MONGO;

const ForumComments = new Schema({
	content: String
});

const ForumSchema = new Schema({
	title: { type: String, required },
	body: { type: String, required },
	comments: [ForumComments],
	createdAt: { type: Date, default: Date.now() }
});

module.exports = ForumSchema;
