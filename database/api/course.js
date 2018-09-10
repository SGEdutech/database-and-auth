const route = require('express')
    .Router();
const Course = require('../modles/course');
const DbAPIClass = require('../api-functions');
const courseDbFunctions = new DbAPIClass(Course);

route.get('/all', (req, res) => {
    const skip = (req.query.page - 1) * req.query.items;
    const limit = parseInt(req.query.items, 10);
    courseDbFunctions.getAllData(req.query.demands, skip, limit)
        .then(data => res.send(data))
        .catch(err => console.error(err));
});

route.get('/', (req, res) => {
    courseDbFunctions.getSpecificData(req.query)
        .then(data => res.send(data))
        .catch(err => console.error(err));
});

route.post('/', (req, res) => {
    courseDbFunctions.addCollection(req.body)
        .then(data => res.send(data))
        .catch(err => console.error(err));
});

route.delete('/:_id', (req, res) => {
    courseDbFunctions.deleteOneRow(req.params)
        .then(data => res.send(data))
        .catch(err => console.error(err));
});

module.exports = route;
