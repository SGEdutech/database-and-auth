const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ForumCommentSchema = new Schema({
	content: String,
	user: Schema.Types.ObjectId
})

const forumPostSchema = new Schema({
	title: { type: String, required: true },
	content: { type: String, required: true },
	comments: [ForumCommentSchema]
});

const ForumPost = mongoose.model('forumPost', forumPostSchema);

module.exports = ForumPost;
