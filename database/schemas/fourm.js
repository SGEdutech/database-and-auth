const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FourmComments = new Schema({
	content: String
});

const FourmSchema = new Schema({
	title: String,
	body: String,
	comments: [FourmComments]
});

module.exports = fourmSchema;
