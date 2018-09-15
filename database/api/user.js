const route = require('express').Router();
const User = require('../models/user');
const DbAPIClass = require('../api-functions');
const userDbFunctions = new DbAPIClass(User);
const youShallNotPass = require('../../scripts/login-check');
const {
	claimListing
} = require('../database-scripts/user-claim');

route.get('/info', (req, res) => res.send(req.user));

// todo - fix this route
route.get('/all', (req, res) => {
	const skip = (req.query.page - 1) * req.query.items;
	const limit = parseInt(req.query.items, 10);
	userDbFunctions
		.getAllData(req.query.demands, skip, limit)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/', (req, res) => {
	userDbFunctions
		.getSpecificData(req.query)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/', (req, res) => {
	userDbFunctions
		.addCollection(req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/add/:id/:arrayName', (req, res) => {
	const elementToBePushed = req.body.string || req.body;

	if (req.params.arrayName === 'claims') {
		claimListing(req.params.id, elementToBePushed)
			.then(() => res.send({ done: true }))
			.catch(err => console.error(err));
		return;
	}

	userDbFunctions
		.addElementToArray({ _id: req.params.id }, req.params.arrayName, elementToBePushed)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/update/:idOfCollection/:arrayName/:idOfNestedObject', (req, res) => {
	userDbFunctions
		.updateElementInArray({
			_id: req.params.idOfCollection
		}, req.params.arrayName, req.params.idOfNestedObject, req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/:_id', (req, res) => {
	userDbFunctions.updateOneRow(req.params, req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/delete/:arrayName/:_id', (req, res) => {
	const identifier = req.body.string || req.body;
	userDbFunctions
		.deleteElementFromArray({ _id: req.params._id }, req.params.arrayName, identifier)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/empty/:keyname', (req, res) => {
	userDbFunctions
		.emptyKey(req.body, req.params.keyname)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/:_id', (req, res) => {
	userDbFunctions.deleteOneRow(req.params)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

module.exports = route;
