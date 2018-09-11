const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const forumCommentSchema = new Schema({
    forumPost: { type: Schema.Types.ObjectId, required: true, ref: 'forumPost' },
    content: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, required: true, ref: 'user' }
});

const ForumPost = mongoose.model('forumPost', forumCommentSchema);

module.exports = ForumPost;
