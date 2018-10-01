const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ForumComments = new Schema({
	content: String
});

const ForumSchema = new Schema({
	title: String,
	body: String,
	comments: [ForumComments],
	createdAt: { type: Date, default: Date.now() }
});

module.exports = ForumSchema;