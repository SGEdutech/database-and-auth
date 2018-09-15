const route = require('express')
	.Router();
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
	demandedAdvertisements = parseInt(demandedAdvertisements);

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
		promotedDbFunction.getMultipleData({
			category: 'tuition'
		}, {
			limit: demandedAdvertisements
		}).then(promotedInfos => {
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

route.get('/all', (req, res) => {
	const queryObject = req.query;
	const skip = parseInt(queryObject.skip, 10) || 0;
	const limit = parseInt(queryObject.limit, 10) || 0;
	const incrementHits = queryObject.incrementHits || true;
	const demands = queryObject.demands || '';
	const isAdvertisementRequested = areAdvertisementsRequested(queryObject);

	if (isAdvertisementRequested === false) {
		tuitionDbFunctions.getAllData({
			skip,
			limit,
			demands,
			incrementHits
		}).then(data => res.send(data))
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

	tuitionDbFunctions.getSpecificData(req.query, {
		incrementView,
		homeAdvertisement,
		searchAdvertisement,
		relatedAdvertisement
	}).then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/plus-courses', (req, res) => {
	tuitionDbFunctions.getOneRelationalData(req.query, {
		populate: 'courses'
	})
		.then(data => res.send(data)).catch(err => console.error(err));
});

route.get('/plus-courses-and-batches', (req, res) => {
	tuitionDbFunctions.getOneRelationalDataWithDepthTwo(req.query, {
		path: 'courses'
	}, {
		path: 'batches'
	})
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
	tuitionDbFunctions.addElementToArray({
		_id: req.params._id
	}, req.params.arrayName, elementToBePushed)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/', (req, res) => {
	tuitionDbFunctions.addCollection(req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/update/:idOfCollection/:arrayName/:idOfNestedObject', (req, res) => {
	tuitionDbFunctions
		.updateElementInArray({ _id: req.params.idOfCollection }, req.params.arrayName, req.params.idOfNestedObject, req.body)
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
	tuitionDbFunctions
		.deleteElementFromArray({ _id: req.params._id }, req.params.arrayName, identifier)
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

module.exports = route;
