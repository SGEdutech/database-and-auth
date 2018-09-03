const route = require('express')
	.Router();
const Blog = require('../modles/blog');
const escapeRegex = require('../../eduatlas-backend/scripts/escape-regex');
const DbAPIClass = require('../api-functions');
const blogDbFunctions = new DbAPIClass(Blog);

route.get('/all', (req, res) => {
	const skip = (req.query.page - 1) * req.query.items;
	const limit = parseInt(req.query.items, 10);
	blogDbFunctions
		.getAllData(req.query.demands, skip, limit)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/', (req, res) => {
	blogDbFunctions
		.getSpecificData(req.query, true)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/search', (req, res) => {
	const regex = new RegExp(escapeRegex(req.query.search), 'i');
	blogDbFunctions
		.getMultipleData({
			name: regex
		}, 'name')
		.then(data => res.send(data));
});

route.post('/add/:arrayName/:_id', (req, res) => {
	const elementToBePushed = req.body.string || req.body;
	blogDbFunctions
		.addElementToArray({
			_id: req.params._id
		}, req.params.arrayName, elementToBePushed)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/', (req, res) => {
	blogDbFunctions
		.addCollection(req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/update/:idOfCollection/:arrayName/:idOfNestedObject', (req, res) => {
	blogDbFunctions
		.updateElementInArray({
			_id: req.params.idOfCollection
		}, req.params.arrayName, req.params.idOfNestedObject, req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/:_id', (req, res) => {
	blogDbFunctions
		.updateOneRow(req.params, req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/delete/:arrayName/:_id', (req, res) => {
	const identifier = req.body.string || req.body;
	blogDbFunctions
		.deleteElementFromArray({
			_id: req.params._id
		}, req.params.arrayName, identifier)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/empty/:keyname', (req, res) => {
	blogDbFunctions
		.emptyKey(req.body, req.params.keyname)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/:_id', (req, res) => {
	blogDbFunctions
		.deleteOneRow(req.params)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

module.exports = route;
