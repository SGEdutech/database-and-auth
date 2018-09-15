const route = require('express').Router();
const User = require('../models/user');
const DbAPIClass = require('../api-functions');
const userDbFunctions = new DbAPIClass(User);
const { claimListing } = require('../database-scripts/user-claim');
const Tuition = require('../models/tuition');
const tuitionDbFunctions = new DbAPIClass(Tuition);
const School = require('../models/school');
const schoolDbFunctions = new DbAPIClass(School);

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

route.get('/reviews', (req, res) => {
	if (req.user === undefined) throw new Error('User nor logged in');

	const userReviews = [];

	function filterUserReviews(collections, category) {
		collections.forEach(collection => {
			collection.reviews.forEach(review => {
				if (review.owner === req.user._id) {
					review.category = category;
					userReviews.push(review);
				}
			})
		})
	}

	Promise.all([
		tuitionDbFunctions.getAllData({ demands: 'name reviews' }),
		schoolDbFunctions.getAllData({ demands: 'name reviews' })
	]).then(tuitionsAndSchoolCollection => {
		filterUserReviews(tuitionsAndSchoolCollection[0], 'tuition');
		filterUserReviews(tuitionsAndSchoolCollection[1], 'school');
		res.send(userReviews);
	})
})

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