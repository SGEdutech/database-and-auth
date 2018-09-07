const route = require('express')
	.Router();
const Solution = require('../modles/solution');
const escapeRegex = require('../../../eduatlas-backend/scripts/escape-regex');
const DbAPIClass = require('../api-functions');
const solutionDbFunctions = new DbAPIClass(Solution);

route.get('/all', (req, res) => {
	req.query.demands = req.query.demands || '';
	solutionDbFunctions.getAllData(req.query.demands)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/search', (req, res) => {
	const regex = new RegExp(escapeRegex(req.query.search), 'i');
	solutionDbFunctions.getMultipleData({ name: regex }, 'name')
		.then(data => res.send(data));
});

route.get('/', (req, res) => {
	solutionDbFunctions.getSpecificData(req.query)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/', (req, res) => {
	solutionDbFunctions.addCollection(req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/:_id', (req, res) => {
	solutionDbFunctions.updateOneRow(req.params, req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/:_id', (req, res) => {
	solutionDbFunctions.deleteOneRow(req.params)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

module.exports = route;
