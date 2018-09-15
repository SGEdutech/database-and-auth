const route = require('express')
	.Router();
const Batch = require('../models/batch');
const DbAPIClass = require('../api-functions');
const batchDbFunctions = new DbAPIClass(Batch);

route.get('/all', (req, res) => {
	const skip = (req.query.page - 1) * req.query.items;
	const limit = parseInt(req.query.items, 10);
	batchDbFunctions.getAllData(req.query.demands, skip, limit)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/', (req, res) => {
	batchDbFunctions.getSpecificData(req.query)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/', (req, res) => {
	batchDbFunctions.addCollection(req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/:_id', (req, res) => {
	batchDbFunctions.deleteOneRow(req.params)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

module.exports = route;
