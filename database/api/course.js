const route = require('express')
    .Router();
const Course = require('../models/course');
const DbAPIClass = require('../api-functions');
const courseDbFunctions = new DbAPIClass(Course);

route.get('/all', (req, res) => {
    const skip = (req.query.page - 1) * req.query.items;
    const limit = parseInt(req.query.items, 10);
    courseDbFunctions.getAllData(req.query.demands, skip, limit)
        .then(data => res.send(data))
        .catch(err => console.error(err));
});

route.get('/plus-batches', (req, res) => {
    const demands = req.query.demands || '';
    const batchDemands = req.query.batchDemands || '';

    delete req.query.demands;
    delete req.query.batchDemands;

    const relationalConfig = {
        populate: 'batch',
        populationDemands: batchDemands
    };

    courseDbFunctions.getOneRelationalData(req.query, relationalConfig, {demands})
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
