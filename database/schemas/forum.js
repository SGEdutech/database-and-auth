const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ForumComments = new Schema({
	content: String
});

const ForumSchema = new Schema({
	title: String,
	body: String,
	comments: [ForumComments]
});

module.exports = ForumSchema;
