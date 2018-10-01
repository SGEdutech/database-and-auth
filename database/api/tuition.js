const route = require('express').Router();
const { ObjectId } = require('mongoose').Types;
const escapeRegex = require('../../scripts/escape-regex');
const DbAPIClass = require('../api-functions');
const Tuition = require('../models/tuition');
const PromotedHome = require('../models/promoted-home');
const PromotedSearch = require('../models/promoted-search');
const PromotedRelated = require('../models/promoted-related');
const tuitionDbFunctions = new DbAPIClass(Tuition);
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

	return {
		promotedDbFunction,
		demandedAdvertisements
	};
}

function getPromotedData(queryObject) {
	const {
		promotedDbFunction,
		demandedAdvertisements
	} = getPromotedDbFunAndDemandedAdvertisements(queryObject);

	return new Promise((resolve, reject) => {
		promotedDbFunction.getMultipleData({ category: 'tuition' }, { limit: demandedAdvertisements })
			.then(promotedInfos => {
				const promotedListingIdArr = [];
				promotedInfos.forEach(promotedInfo => promotedListingIdArr.push(promotedInfo.listingId));
				return tuitionDbFunctions.getDataFromMultipleIds(promotedListingIdArr, queryObject)
			})
			.then(data => resolve(data)).catch(err => reject(err));
	});
}

function areAdvertisementsRequested(queryObject) {
	return Boolean(queryObject.homeAdvertisement || queryObject.searchAdvertisement || queryObject.relatedAdvertisement);
}

function prependToObjKey(obj, prependStr) {
	const keys = Object.keys(obj);

	keys.forEach(key => {
		obj[prependStr + key] = obj[key];
		delete obj[key];
	})
}

route.get('/all', (req, res) => {
	const queryObject = req.query;
	const skip = parseInt(queryObject.skip, 10) || 0;
	const limit = parseInt(queryObject.limit, 10) || 0;
	const incrementHits = queryObject.incrementHits || true;
	const demands = queryObject.demands || '';
	const isAdvertisementRequested = areAdvertisementsRequested(queryObject);

	if (isAdvertisementRequested === false) {
		tuitionDbFunctions.getAllData({ skip, limit, demands, incrementHits })
			.then(data => res.send(data))
			.catch(err => console.error(err));
		return;
	}

	const poorDataPromise = tuitionDbFunctions.getAllData({
		demands,
		skip,
		limit,
		incrementHits
	});

	const promotedDataPromise = getPromotedData(queryObject);

	Promise.all([promotedDataPromise, poorDataPromise]).then(dataArr => res.send(dataArr[0].concat(dataArr[1])))
		.catch(err => console.error(err));
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

	tuitionDbFunctions.getSpecificData(req.query, { incrementView, homeAdvertisement, searchAdvertisement, relatedAdvertisement })
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/plus-courses', (req, res) => {
	tuitionDbFunctions.getOneRelationalData(req.query, { populate: 'courses' })
		.then(data => res.send(data)).catch(err => console.error(err));
});

route.get('/plus-courses-and-batches', (req, res) => {
	tuitionDbFunctions.getOneRelationalDataWithDepthTwo(req.query, { path: 'courses' }, { path: 'batches' })
		.then(data => res.send(data)).catch(err => console.error(err));
});

route.get('/search', (req, res) => {
	const queryObject = req.query;
	const demands = queryObject.demands || '';
	const skip = parseInt(queryObject.skip, 10) || 0;
	const limit = parseInt(queryObject.limit, 10) || 0;
	const isAdvertisementRequested = areAdvertisementsRequested(queryObject);
	const incrementHits = queryObject.incrementHits || true;
	const advertisementInfoObject = {
		homeAdvertisement: queryObject.homeAdvertisement,
		searchAdvertisement: queryObject.searchAdvertisement,
		relatedAdvertisement: queryObject.relatedAdvertisement
	};

	delete queryObject.demands;
	delete queryObject.skip;
	delete queryObject.limit;
	delete queryObject.sortBy;
	delete queryObject.homeAdvertisement;
	delete queryObject.searchAdvertisement;
	delete queryObject.relatedAdvertisement;
	delete queryObject.incrementHits;

	const searchCriteria = {};
	const queryKeys = Object.keys(queryObject);
	queryKeys.forEach(key => {
		const value = JSON.parse(queryObject[key]);
		value.search = escapeRegex(value.search); // Sanitize Regex
		const regexString = value.fullTextSearch ? `^${value.search}$` : value.search;
		searchCriteria[key] = new RegExp(regexString, 'i');
	});

	const poorDataPromise = tuitionDbFunctions.getMultipleData(searchCriteria, {
		demands,
		skip,
		limit,
		incrementHits
	});

	if (isAdvertisementRequested === false) {
		poorDataPromise.then(data => res.send(data)).catch(err => console.error(err));
		return;
	}

	const promotedDataPromise = getPromotedData(advertisementInfoObject);

	Promise.all([promotedDataPromise, poorDataPromise]).then(dataArr => res.send(dataArr[0].concat(dataArr[1])))
		.catch(err => console.error(err));
});

route.post('/add/:_id/:arrayName', (req, res) => {
	const elementToBePushed = req.body.string || req.body;
	tuitionDbFunctions.addElementToArray({ _id: req.params._id }, req.params.arrayName, elementToBePushed)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/', (req, res) => {
	tuitionDbFunctions.addCollection(req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/update/:idOfCollection/:arrayName/:idOfNestedObject', (req, res) => {
	tuitionDbFunctions.updateElementInArray({ _id: req.params.idOfCollection }, req.params.arrayName, req.params.idOfNestedObject, req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/:_id', (req, res) => {
	tuitionDbFunctions.updateOneRow(req.params, req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/delete/:_id/:arrayName', (req, res) => {
	const identifier = req.body.string || req.body;
	tuitionDbFunctions.deleteElementFromArray({ _id: req.params._id }, req.params.arrayName, identifier)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/empty/:keyname', (req, res) => {
	tuitionDbFunctions.emptyKey(req.body, req.params.keyname)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/:_id', (req, res) => {
	// if (req.params._id.match(/^[0-9a-fA-F]{24}$/) === null) res.send('Not a valid id');
	tuitionDbFunctions.deleteOneRow(req.params)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

// Courses
route.get('/:tuitionId/courses', (req, res) => {
	const { tuitionId } = req.params;
	Tuition.find({ _id: tuitionId }).select('courses')
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/:tuitionId/course', (req, res) => {
	const { tuitionId } = req.params;
	Tuition.findByIdAndUpdate(tuitionId, { $push: { courses: req.body } })
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/:tuitionId/course/:courseId', (req, res) => {
	const { tuitionId } = req.params;
	const { courseId } = req.params;

	prependToObjKey(req.body, 'courses.$.');

	Tuition.findOneAndUpdate({ '_id': tuitionId, 'courses._id': courseId }, { $set: req.body })
		.then(data => res.send(data)).catch(err => console.error(err));
});

route.delete('/:tuitionId/course/:courseId', (req, res) => {
	const { tuitionId } = req.params;
	const { courseId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { $pull: { courses: { _id: courseId } } })
		.then(data => res.send(data)).catch(err => console.error(err))
});

// Batches

// Todo: Write mongo query
route.get('/:tuitionId/course/:courseId/batches', (req, res) => {
	const { tuitionId, courseId } = req.params;

	Tuition.findById(tuitionId).select('courses')
		.then(tuition => {
			tuition.courses.forEach(course => {
				if (course._id === courseId) res.send(course.batches);
			})
		}).catch(err => console.error(err))
});

route.post('/:tuitionId/course/:courseId/batch', (req, res) => {
	const { tuitionId, courseId } = req.params;
	Tuition.findOneAndUpdate({ '_id': tuitionId, 'courses._id': courseId }, { $push: { 'courses.$.batches': req.body } })
		.then(data => res.send(data)).catch(err => console.error(err))
})

route.put('/:tuitionId/course/:courseId/batch/:batchId', (req, res) => {
	const { tuitionId, courseId, batchId } = req.params;

	prependToObjKey(req.body, 'courses.$[i].batches.$[j].');

	// Strings must be casted to object ID in array filter
	Tuition.findByIdAndUpdate(tuitionId, { $set: req.body }, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }] })
		.then(data => res.send(data)).catch(err => console.error(err))
});

route.delete('/:tuitionId/course/:courseId/batch/:batchId', (req, res) => {
	const { tuitionId, courseId, batchId } = req.params;

	Tuition.findOneAndUpdate({ '_id': tuitionId, 'courses._id': courseId }, { $pull: { 'courses.$.batches': { _id: batchId } } })
		.then(data => res.send(data)).catch(err => console.error(err))
});

route.post('/:tuitionId/course/:courseId/batch/:batchId/student', (req, res) => {
	const { tuitionId, courseId, batchId } = req.params;
	// Can't think of a better name
	const removeElements = Array.isArray(req.body.students) ? { $each: req.body.students } : req.body.students;

	Tuition.findByIdAndUpdate(tuitionId, { $push: { 'courses.$[i].batches.$[j].students': removeElements } }, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }] })
		.then(data => res.send(data)).catch(err => console.error(err))
});

route.delete('/:tuitionId/course/:courseId/batch/:batchId/student', (req, res) => {
	const { tuitionId, courseId, batchId } = req.params;
	const pullQuery = Array.isArray(req.body.students) ? { $pullAll: { 'courses.$[i].batches.$[j].students': req.body.students } } : { $pull: { 'courses.$[i].batches.$[j].students': req.body.students } };

	Tuition.findByIdAndUpdate(tuitionId, pullQuery, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }] })
		.then(data => res.send(data)).catch(err => console.error(err));
});

// Fourm
route.get('/:tuitionId/fourm', (req, res) => {
	// Todo: Use aggration
});

route.post('/:tuitionId/fourm', (req, res) => {
	const { tuitionId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { $push: { fourms: req.body } })
		.then(data => res.send(data)).catch(err => console.error(err));
});

route.put('/:tuitionId/fourm/:forumId', (req, res) => {
	const { tuitionId, forumId } = req.params;

	prependToObjKey(req.body, 'fourms.$.');

	Tuition.findOneAndUpdate({ _id: tuitionId, fourms: { $elemMatch: { _id: forumId } } }, req.body)
		.then(data => res.send(data)).catch(err => console.error(err));
});

route.delete('/:tuitionId/fourm/:forumId', (req, res) => {
	const { tuitionId, forumId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { $pull: { fourms: { _id: forumId } } })
		.then(data => res.send(data)).catch(err => console.error(err));
})

// Forum comment

route.post('/:tuitionId/fourm/:forumId/comment', (req, res) => {
	const { tuitionId, fourmId } = req.params;

	Tuition.findOneAndUpdate({ _id: tuitionId, fourms: { $elemMatch: { _id: fourmId } } }, { $push: { 'fourms.$.comments': req.body } })
		.then(data => res.send(data)).catch(err => console.error(err));
});

route.put('/:tuitionId/fourm/:forumId/comment/:commentId', (req, res) => {
	const { tuitionId, fourmId, commentId } = req.params;

	Tuition.findOneAndUpdate(tuitionId, { 'fourms.$[i].comments.$[j]': req.body }, { arrayFilters: [{ 'i._id': ObjectId(fourmId), 'j._id': ObjectId(commentId) }] })
		.then(data => res.send(data)).catch(err => console.error(err));
});

route.delete('/:tuitionId/fourm/:forumId/comment/:commentId', (req, res) => {
	const { tuitionId, fourmId, commentId } = req.params;

	Tuition.findOneAndUpdate({ _id: tuitionId, fourms: { $elemMatch: { _id: fourmId } } }, { $pull: { 'forums.$.comments': { _id: commentId } } })
		.then(data => res.send(data)).catch(err => console.error(err));
});

module.exports = route;
