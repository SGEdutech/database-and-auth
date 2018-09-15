const route = require('express')
	.Router();
const Issue = require('../models/issue');
const DbAPIClass = require('../api-functions');
const issueDbFunctions = new DbAPIClass(Issue);

route.get('/all', (req, res) => {
	const skip = (req.query.page - 1) * req.query.items;
	const limit = parseInt(req.query.items, 10);
	issueDbFunctions.getAllData(req.query.demands, skip, limit)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/', (req, res) => {
	issueDbFunctions.getSpecificData(req.query)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/', (req, res) => {
	issueDbFunctions.addCollection(req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/:_id', (req, res) => {
	issueDbFunctions.deleteOneRow(req.params)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

module.exports = route;
