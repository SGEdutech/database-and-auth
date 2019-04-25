const route = require('express').Router();
const { ObjectId } = require('mongoose').Types;
const escapeRegex = require('../../scripts/escape-regex');
const DbAPIClass = require('../api-functions');
const Event = require('../models/event');
const PromotedHome = require('../models/promoted-home');
const PromotedSearch = require('../models/promoted-search');
const PromotedRelated = require('../models/promoted-related');
const eventDbFunctions = new DbAPIClass(Event);
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
		promotedDbFunction.getMultipleData({ category: 'event' }, { limit: demandedAdvertisements })
			.then(promotedInfos => {
				const promotedListingIdArr = [];
				promotedInfos.forEach(promotedInfo => promotedListingIdArr.push(promotedInfo.listingId));
				return eventDbFunctions.getDataFromMultipleIds(promotedListingIdArr, queryObject)
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
		const opts = { skip, limit, demands, incrementHits };
		eventDbFunctions.getAllData(opts).then(data => res.send(data))
			.catch(err => console.error(err));
		return;
	}

	const poorDataPromise = eventDbFunctions.getAllData({
		demands,
		skip,
		limit,
		incrementHits
	});

	const promotedDataPromise = getPromotedData(queryObject);

	Promise.all([promotedDataPromise, poorDataPromise]).then(dataArr => res.send(dataArr[0].concat(dataArr[1])))
		.catch(err => console.error(err));
});

route.get('/claimed', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	const claimedEvents = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'event') claimedEvents.push(ObjectId(listingInfo.listingId));
	});

	Event.find({ _id: { $in: claimedEvents } }).then(events => res.send(events))
		.catch(err => console.error(err))
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
		const searchData = await Event.paginate(databaseQuery, { limit, select: demands, page });
		res.send(searchData);
	} catch (error) {
		console.error(error);
	}
});

route.get('/super-admin', (req, res) => {
	Event.find({ signedBy: { $regex: new RegExp(req.query.signedBy, 'i') }, updatedOn: { $gte: req.query.fromDate, $lt: req.query.toDate } })
		.then(schools => res.send(schools)).catch(err => console.error(err))
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

	eventDbFunctions.getSpecificData(req.query, {
		incrementView,
		homeAdvertisement,
		searchAdvertisement,
		relatedAdvertisement
	}).then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/add/:_id/:arrayName', (req, res) => {
	const elementToBePushed = req.body.string || req.body;
	eventDbFunctions.addElementToArray({ _id: req.params._id }, req.params.arrayName, elementToBePushed)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/', (req, res) => {
	eventDbFunctions.addCollection(req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/update/:idOfCollection/:arrayName/:idOfNestedObject', (req, res) => {
	eventDbFunctions
		.updateElementInArray({ _id: req.params.idOfCollection }, req.params.arrayName, req.params.idOfNestedObject, req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/:_id', (req, res) => {
	eventDbFunctions.updateOneRow(req.params, req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/delete/:_id/:arrayName', (req, res) => {
	const identifier = req.body.string || req.body;
	eventDbFunctions.deleteElementFromArray({ _id: req.params._id }, req.params.arrayName, identifier)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/empty/:keyname', (req, res) => {
	eventDbFunctions.emptyKey(req.body, req.params.keyname)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.delete('/:_id', (req, res) => {
	// if (req.params._id.match(/^[0-9a-fA-F]{24}$/) === null) res.send('Not a valid id');
	eventDbFunctions.deleteOneRow(req.params)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

module.exports = route;
