const route = require('express').Router();
const User = require('../models/user');
const DbAPIClass = require('../api-functions');
const userDbFunctions = new DbAPIClass(User);
const { claimListing, unclaimListing } = require('../validation-scripts/user-claim');
const Tuition = require('../models/tuition');
const tuitionDbFunctions = new DbAPIClass(Tuition);
const School = require('../models/school');
const schoolDbFunctions = new DbAPIClass(School);

route.get('/info', (req, res) => res.send(req.user));

// todo - fix this route
route.get('/all', (req, res) => {
	userDbFunctions
		.getAllData(req.query.demands)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/batches', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	Tuition.aggregate([
		{ $match: { students: { $elemMatch: { email: req.user.primaryEmail } } } },
		{ $project: { courses: 1, name: 1 } },
		{ $unwind: '$courses' },
		{ $unwind: '$courses.batches' },
		{ $addFields: { 'courses.batches.tuitionId': '$_id', 'courses.batches.tuitionName': '$name', 'courses.batches.courseId': '$courses._id', 'courses.batches.courseCode': '$courses.code' } },
		{ $replaceRoot: { newRoot: '$courses.batches' } }
	]).then(batches => res.send(batches)).catch(err => console.error(err));
});

route.get('/forums', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	Tuition.aggregate([
		{ $match: { students: { $elemMatch: { email: req.user.primaryEmail } } } },
		{ $project: { forums: 1, name: 1 } },
		{ $unwind: '$forums' },
		{ $addFields: { 'forums.tuitionId': '$_id', 'forums.tuitionName': '$name' } },
		{ $replaceRoot: { newRoot: '$forums' } }
	]).then(data => res.send(data)).catch(err => console.error(err));
});

route.get('/classes', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	Tuition.aggregate([
		{ $match: { students: { $elemMatch: { email: req.user.primaryEmail } } } },
		{ $project: { courses: 1, students: 1 } },
		{ $unwind: '$courses' },
		{ $unwind: '$courses.batches' },
		{ $addFields: { 'courses.batches.studentInfo': { $arrayElemAt: ['$students', { $indexOfArray: ['$students.email', req.user.primaryEmail] }] } } },
		{ $addFields: { 'courses.batches.studentId': '$courses.batches.studentInfo._id' } },
		{ $unwind: '$courses.batches.students' },
		{ $unwind: '$courses.batches.schedules' },
		// Why is this working
		{ $match: { $expr: { $eq: ['$courses.batches.studentId', '$courses.batches.students'] } } },
		{
			$addFields: {
				'courses.batches.schedules.tuitionName': '$name',
				'courses.batches.schedules.tuitionId': '$_id',
				'courses.batches.schedules.courseId': '$courses._id',
				'courses.batches.schedules.courseCode': '$courses.code',
				'courses.batches.schedules.batchId': '$courses.batches._id',
				'courses.batches.schedules.batchCode': '$courses.batches.code',
				'courses.batches.schedules.studentId': '$courses.batches.studentId'
			}
		},
		{ $replaceRoot: { newRoot: '$courses.batches.schedules' } }
	]).then(data => res.send(data)).catch(err => console.error(err));
});

// FIXME: Lot of unnessary information
route.get('/registeration-info', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	Tuition.aggregate([
		{ $match: { students: { $elemMatch: { email: req.user.primaryEmail } } } },
		{ $project: { students: 1 } },
		{ $unwind: '$students' },
		{ $match: { 'students.email': req.user.primaryEmail } },
		{ $replaceRoot: { newRoot: '$students' } }
	]).then(studentDetails => res.send(studentDetails[0])).catch(err => console.error(err));
})

route.get('/payments', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	Tuition.aggregate([
		{ $match: { students: { $elemMatch: { email: req.user.primaryEmail } } } },
		{ $project: { students: 1 } },
		{ $unwind: '$students' },
		{ $match: { 'students.email': req.user.primaryEmail } },
		{ $unwind: '$students.payments' },
		{ $addFields: { 'students.payments.tuitionId': '$_id' } },
		{ $replaceRoot: { newRoot: '$students.payments' } }
	]).then(payment => res.send(payment)).catch(err => console.error(err));
});

route.get('/reviews', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

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
		tuitionDbFunctions.getAllData({
			demands: 'name reviews'
		}),
		schoolDbFunctions.getAllData({
			demands: 'name reviews'
		})
	]).then(tuitionsAndSchoolCollection => {
		filterUserReviews(tuitionsAndSchoolCollection[0], 'tuition');
		filterUserReviews(tuitionsAndSchoolCollection[1], 'school');
		res.send(userReviews);
	})
})

route.get('/', (req, res) => {
	userDbFunctions.getSpecificData(req.query)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/', (req, res) => {
	userDbFunctions.addCollection(req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/add-claim', (req, res) => {
	if (req.user === undefined) {
		res.send('User not logged in');
		return;
	}

	const userId = req.user._id;
	const { listingCategory, listingId } = req.body;

	claimListing(userId, { listingCategory, listingId })
		.then(() => res.end('done')).catch(err => console.error(err));
})

route.post('/add/:id/:arrayName', (req, res) => {
	const elementToBePushed = req.body.string || req.body;

	if (req.params.arrayName === 'claims') {
		claimListing(req.params.id, elementToBePushed)
			.then(() => res.send({
				done: true
			}))
			.catch(err => console.error(err));
		return;
	}

	userDbFunctions
		.addElementToArray({
			_id: req.params.id
		}, req.params.arrayName, elementToBePushed)
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

route.delete('/delete/:_id/:arrayName', (req, res) => {
	const identifier = req.body.string || req.body;
	userDbFunctions
		.deleteElementFromArray({
			_id: req.params._id
		}, req.params.arrayName, identifier)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/empty/:keyname', (req, res) => {
	userDbFunctions
		.emptyKey(req.body, req.params.keyname)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/remove-claim', (req, res) => {
	if (req.user === undefined) {
		res.send('User not logged in');
		return;
	}

	const userId = req.user._id;
	const { listingCategory, listingId } = req.body;
	unclaimListing(userId, { listingCategory, listingId })
		.then(() => res.end('done')).catch(err => console.error(err));
})

route.delete('/:_id', (req, res) => {
	userDbFunctions.deleteOneRow(req.params)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

module.exports = route;
