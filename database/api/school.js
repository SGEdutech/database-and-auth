const route = require('express').Router();
const { ObjectId } = require('mongoose').Types;
const escapeRegex = require('../../scripts/escape-regex');
const DbAPIClass = require('../api-functions');
const School = require('../models/school');
const PromotedHome = require('../models/promoted-home');
const PromotedSearch = require('../models/promoted-search');
const PromotedRelated = require('../models/promoted-related');
const schoolDbFunctions = new DbAPIClass(School);
const promotedHomeDbFunctions = new DbAPIClass(PromotedHome);
const promotedSearchDbFunctions = new DbAPIClass(PromotedSearch);
const promotedRelatedDbFunctions = new DbAPIClass(PromotedRelated);

function getPromotedDbFunAndDemandedAdvertisements(queryObject) {
	let promotedDbFunction;
	let demandedAdvertisements = 0;

	if (queryObject.homeAdvertisement) {
		promotedDbFunction = promotedHomeDbFunctions;
		demandedAdvertisements = queryObject.homeAdvertisement;
	} else if (queryObject.searchAdvertisement) {
		promotedDbFunction = promotedSearchDbFunctions;
		demandedAdvertisements = queryObject.searchAdvertisement;
	} else if (queryObject.relatedAdvertisement) {
		promotedDbFunction = promotedRelatedDbFunctions;
		demandedAdvertisements = queryObject.relatedAdvertisement;
	}
	demandedAdvertisements = parseInt(demandedAdvertisements, 10);

	return { promotedDbFunction, demandedAdvertisements };
}

function getPromotedData(queryObject) {
	const { promotedDbFunction, demandedAdvertisements } = getPromotedDbFunAndDemandedAdvertisements(queryObject);

	return new Promise((resolve, reject) => {
		promotedDbFunction.getMultipleData({ category: 'school' }, { limit: demandedAdvertisements }).then(promotedInfos => {
			const promotedListingIdArr = [];
			promotedInfos.forEach(promotedInfo => promotedListingIdArr.push(promotedInfo.listingId));
			return schoolDbFunctions.getDataFromMultipleIds(promotedListingIdArr, queryObject)
		})
			.then(data => resolve(data)).catch(err => reject(err));
	});
}

function areAdvertisementsRequested(queryObject) {
	return Boolean(queryObject.homeAdvertisement || queryObject.searchAdvertisement || queryObject.relatedAdvertisement);
}

route.get('/all', (req, res) => {
	const queryObject = req.query;
	const skip = parseInt(queryObject.skip, 10) || 0;
	const limit = parseInt(queryObject.limit, 10) || 0;
	const incrementHits = queryObject.incrementHits || true;
	const demands = queryObject.demands || '';
	const isAdvertisementRequested = areAdvertisementsRequested(queryObject);

	if (isAdvertisementRequested === false) {
		schoolDbFunctions.getAllData({ skip, limit, demands, incrementHits }).then(data => res.send(data))
			.catch(err => console.error(err));
		return;
	}

	const poorDataPromise = schoolDbFunctions.getAllData({ demands, skip, limit, incrementHits });

	const promotedDataPromise = getPromotedData(queryObject);

	Promise.all([promotedDataPromise, poorDataPromise]).then(dataArr => res.send(dataArr[0].concat(dataArr[1])))
		.catch(err => console.error(err));
});

route.get('/claimed', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	const claimedSchools = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'school') claimedSchools.push(ObjectId(listingInfo.listingId));
	});

	School.find({ _id: { $in: claimedSchools } }).then(schools => res.send(schools))
		.catch(err => console.error(err))
});

route.get('/', (req, res) => {
	const queryObject = req.query;
	const homeAdvertisement = queryObject.homeAdvertisement || false;
	const searchAdvertisement = queryObject.searchAdvertisement || false;
	const relatedAdvertisement = queryObject.relatedAdvertisement || false;
	const incrementView = queryObject.incrementView || true;

	delete queryObject.homeAdvertisement;
	delete queryObject.searchAdvertisement;
	delete queryObject.relatedAdvertisement;
	delete queryObject.incrementView;

	schoolDbFunctions.getSpecificData(req.query, {
		incrementView,
		homeAdvertisement,
		searchAdvertisement,
		relatedAdvertisement
	}).then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/search', async (req, res) => {
	try {
		const opts = req.query.opts && JSON.parse(req.query.opts);
		const { demands = 0, limit = 0, page = 1 } = opts;
		const searchRegex = new RegExp(req.query.search || '', 'i');
		const locationRegex = new RegExp(req.query.location, 'i');
		const databaseQuery = req.query.location ? {
			$and: [
				{ name: searchRegex },
				{
					$or: [
						{ addressLine1: locationRegex },
						{ addressLine2: locationRegex },
						{ city: locationRegex },
						{ district: locationRegex },
						{ state: locationRegex }
					]
				}
			]
		} : { name: searchRegex };
		const searchData = await School.paginate(databaseQuery, { limit, select: demands, page });
		res.send(searchData);
	} catch (error) {
		console.error(error);
	}
});

route.get('/super-admin', (req, res) => {
	School.find({ signedBy: { $regex: new RegExp(req.query.signedBy, 'i') }, updated: { $gte: req.query.fromDate, $lt: req.query.toDate } })
		.then(schools => res.send(schools)).catch(err => console.error(err))
});

route.post('/add/:_id/:arrayName', (req, res) => {
	const elementToBePushed = req.body.string || req.body;
	schoolDbFunctions.addElementToArray({ _id: req.params._id }, req.params.arrayName, elementToBePushed)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/', (req, res) => {
	schoolDbFunctions.addCollection(req.body)
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
	schoolDbFunctions.updateOneRow(req.params, req.body)
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
	schoolDbFunctions.emptyKey(req.body, req.params.keyname)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/:_id', (req, res) => {
	// if (req.params._id.match(/^[0-9a-fA-F]{24}$/) === null) res.send('Not a valid id');
	schoolDbFunctions.deleteOneRow(req.params)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

// Courses
route.get('/:schoolId/courses', (req, res) => {
	const { schoolId } = req.params;
	School.find({ _id: schoolId }).select('courses')
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/:schoolId/course', (req, res) => {
	const { schoolId } = req.params;
	School.findByIdAndUpdate(schoolId, { $push: { courses: req.body } })
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/:schoolId/course/:courseId', (req, res) => {
	const { schoolId } = req.params;
	const { courseId } = req.params;

	prependToObjKey(req.body, 'courses.$.');

	School.findOneAndUpdate({ '_id': schoolId, 'courses._id': courseId }, { $set: req.body })
		.then(data => res.send(data)).catch(err => console.error(err));
});

route.delete('/:schoolId/course/:courseId', (req, res) => {
	const { schoolId } = req.params;
	const { courseId } = req.params;

	School.findByIdAndUpdate(schoolId, { $pull: { courses: { _id: courseId } } })
		.then(data => res.send(data)).catch(err => console.error(err))
});

// Batches

// Todo: Write mongo query
route.get('/:schoolId/course/:courseId/batches', (req, res) => {
	const { schoolId, courseId } = req.params;

	School.findById(schoolId).select('courses')
		.then(school => {
			school.courses.forEach(course => {
				if (course._id === courseId) res.send(course.batches);
			})
		}).catch(err => console.error(err))
});

route.post('/:schoolId/course/:courseId/batch', (req, res) => {
	const { schoolId, courseId } = req.params;
	School.findOneAndUpdate({ '_id': schoolId, 'courses._id': courseId }, { $push: { 'courses.$.batches': req.body } })
		.then(data => res.send(data)).catch(err => console.error(err))
})

route.put('/:schoolId/course/:courseId/batch/:batchId', (req, res) => {
	const { schoolId, courseId, batchId } = req.params;

	prependToObjKey(req.body, 'courses.$[i].batches.$[j].');

	// Strings must be casted to object ID in array filter
	School.findByIdAndUpdate(schoolId, { $set: req.body }, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }] })
		.then(data => res.send(data)).catch(err => console.error(err))
});

route.delete('/:schoolId/course/:courseId/batch/:batchId', (req, res) => {
	const { schoolId, courseId, batchId } = req.params;

	School.findOneAndUpdate({ '_id': schoolId, 'courses._id': courseId }, { $pull: { 'courses.$.batches': { _id: batchId } } })
		.then(data => res.send(data)).catch(err => console.error(err))
});

route.post('/:schoolId/course/:courseId/batch/:batchId/student', (req, res) => {
	const { schoolId, courseId, batchId } = req.params;
	// Can't think of a better name
	const removeElements = Array.isArray(req.body.students) ? { $each: req.body.students } : req.body.students;

	School.findByIdAndUpdate(schoolId, { $push: { 'courses.$[i].batches.$[j].students': removeElements } }, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }] })
		.then(data => res.send(data)).catch(err => console.error(err))
});

route.delete('/:schoolId/course/:courseId/batch/:batchId/student', (req, res) => {
	const { schoolId, courseId, batchId } = req.params;
	const pullQuery = Array.isArray(req.body.students) ? { $pullAll: { 'courses.$[i].batches.$[j].students': req.body.students } } : { $pull: { 'courses.$[i].batches.$[j].students': req.body.students } };

	School.findByIdAndUpdate(schoolId, pullQuery, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }] })
		.then(data => res.send(data)).catch(err => console.error(err));
});

module.exports = route;
