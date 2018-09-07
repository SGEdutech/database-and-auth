const route = require('express')
	.Router();
const School = require('../modles/school');
const escapeRegex = require('../../../eduatlas-backend/scripts/escape-regex');
const DbAPIClass = require('../api-functions');
const schoolDbFunctions = new DbAPIClass(School);

route.get('/all', (req, res) => {
	const queryObject = req.query;
	const skip = parseInt(queryObject.skip, 10) || 0;
	const limit = parseInt(queryObject.limit, 10) || 0;
	schoolDbFunctions
		.getAllData(queryObject.demands, skip, limit)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/search', (req, res) => {
	const queryObject = req.query;
	const demands = queryObject.demands || '';
	const skip = parseInt(queryObject.skip, 10) || 0;
	const limit = parseInt(queryObject.limit, 10) || 0;
	const sortBy = queryObject.sortBy || undefined;
	delete queryObject.demands;
	delete queryObject.skip;
	delete queryObject.limit;
	delete queryObject.sortBy;
	const searchCriteria = {};
	const queryKeys = Object.keys(queryObject);
	queryKeys.forEach(key => {
		const value = JSON.parse(queryObject[key]);
		if (value.fullTextSearch) {
			searchCriteria[key] = new RegExp(`^${escapeRegex(value.search)}$`, 'i');
		} else {
			searchCriteria[key] = new RegExp(escapeRegex(value.search), 'i');
		}
	});
	schoolDbFunctions
		.getMultipleData(searchCriteria, demands, skip, limit, sortBy)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/', (req, res) => {
	schoolDbFunctions
		.getSpecificData(req.query, true)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/add/:arrayName/:_id', (req, res) => {
	const elementToBePushed = req.body.string || req.body;
	schoolDbFunctions
		.addElementToArray({
			_id: req.params._id
		}, req.params.arrayName, elementToBePushed)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/', (req, res) => {
	schoolDbFunctions
		.addCollection(req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});
route.put('/update/:idOfCollection/:arrayName/:idOfNestedObject', (req, res) => {
	schoolDbFunctions
		.updateElementInArray({
			_id: req.params.idOfCollection
		}, req.params.arrayName, req.params.idOfNestedObject, req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/:_id', (req, res) => {
	schoolDbFunctions
		.updateOneRow(req.params, req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/delete/:_id/:arrayName', (req, res) => {
	const identifier = req.body.string || req.body;
	schoolDbFunctions
		.deleteElementFromArray({
			_id: req.params._id
		}, req.params.arrayName, identifier)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/empty/:keyname', (req, res) => {
	schoolDbFunctions
		.emptyKey(req.body, req.params.keyname)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/:_id', (req, res) => {
	schoolDbFunctions
		.deleteOneRow(req.params)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

module.exports = route;
