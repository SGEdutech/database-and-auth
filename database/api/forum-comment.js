const route = require('express')
    .Router();
const ForumComment = require('../models/forum-comment');
const DbAPIClass = require('../api-functions');
const forumCommentDbFunctions = new DbAPIClass(ForumComment);

route.get('/all', (req, res) => {
    const skip = (req.query.page - 1) * req.query.items;
    const limit = parseInt(req.query.items, 10);
    forumCommentDbFunctions.getAllData(req.query.demands, skip, limit)
        .then(data => res.send(data))
        .catch(err => console.error(err));
});

route.get('/', (req, res) => {
    forumCommentDbFunctions.getSpecificData(req.query)
        .then(data => res.send(data))
        .catch(err => console.error(err));
});

route.post('/', (req, res) => {
    forumCommentDbFunctions.addCollection(req.body)
        .then(data => res.send(data))
        .catch(err => console.error(err));
});

route.delete('/:_id', (req, res) => {
    forumCommentDbFunctions.deleteOneRow(req.params)
        .then(data => res.send(data))
        .catch(err => console.error(err));
});

module.exports = route;
