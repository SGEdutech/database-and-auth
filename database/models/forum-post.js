const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const forumPostSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: 'forumComment' }]
});

const ForumPost = mongoose.model('forumPost', forumPostSchema);

module.exports = ForumPost;
