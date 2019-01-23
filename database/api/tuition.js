const route = require('express').Router();
const path = require('path');
const { ObjectId } = require('mongoose').Types;
const _ = require('lodash');
const removeWords = require('remove-words');
const escapeRegex = require('../../scripts/escape-regex');
const deleteThisShit = require('../../scripts/fsunlink.js');
const DbAPIClass = require('../api-functions');
const Tuition = require('../models/tuition');
const Notification = require('../models/notification');
const PromotedHome = require('../models/promoted-home');
const PromotedSearch = require('../models/promoted-search');
const PromotedRelated = require('../models/promoted-related');
const tuitionDbFunctions = new DbAPIClass(Tuition);
const promotedHomeDbFunctions = new DbAPIClass(PromotedHome);
const promotedSearchDbFunctions = new DbAPIClass(PromotedSearch);
const promotedRelatedDbFunctions = new DbAPIClass(PromotedRelated);
const sendMail = require('../../scripts/send-mail');
const sendReciept = require('../../scripts/send-reciept');
const { isProd } = require('../../config.json');

function titleCase(str) {
	const splitStr = str.toLowerCase().split(' ');
	splitStr.forEach((word, index) => splitStr[index] = splitStr[index].charAt(0).toUpperCase() + splitStr[index].substring(1));
	return splitStr.join(' ');
}

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
	});
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

route.get('/claimed', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	const claimedTuitions = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'tuition') claimedTuitions.push(ObjectId(listingInfo.listingId));
	});

	Tuition.find({ _id: { $in: claimedTuitions } }).then(tuitions => res.send(tuitions))
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

	tuitionDbFunctions.getSpecificData(req.query, { incrementView, homeAdvertisement, searchAdvertisement, relatedAdvertisement })
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/multiple', (req, res) => {
	if (Array.isArray(req.query.tuitions) === false && req.query._id === undefined) throw new Error('No tuition id provided');
	const tuitionArr = req.query.tuitions || [req.query._id];

	Tuition.find({ _id: { $in: tuitionArr } }).then(tuitions => res.send(tuitions))
		.catch(err => console.error(err));
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

// Opimise
route.get('/relevent', async (req, res) => {
	try {
		// Optimise!
		const search = req.query.search || '';
		const location = req.query.location || '';
		const searchWordsRegexArr = search.split(' ').map(word => new RegExp(word, 'i'));
		const locationWordRegexArr = location.split(' ').map(word => new RegExp(word, 'i'));
		const limit = req.query.limit || 0;
		const skip = req.query.skip || 0;

		delete req.query.search;
		delete req.query.limit;
		delete req.query.skip;

		const result = await Tuition.aggregate([
		{
			$match: {
				$or: [
					{ addressLine1: { $in: locationWordRegexArr } },
					{ addressLine2: { $in: locationWordRegexArr } },
					{ city: { $in: locationWordRegexArr } },
					{ district: { $in: locationWordRegexArr } },
					{ state: { $in: locationWordRegexArr } }
				]
			}
		},
		{
			$match: {
				$or: [
					{ tags: { $in: searchWordsRegexArr } },
					{ name: { $in: searchWordsRegexArr } },
				]
			}
		}]);

		result.splice(0, skip);
		if (limit) result.splice(limit);

		res.send(result);
	} catch (err) {
		console.error(err);
	}
});

route.get('/super-admin', (req, res) => {
	Tuition.find({ signedBy: { $regex: new RegExp(req.query.signedBy, 'i') }, updated: { $gte: req.query.fromDate, $lt: req.query.toDate } })
		.then(tuitions => res.send(tuitions)).catch(err => console.error(err));
});

route.get('/dashboard/:_id', (req, res) => {
	const { _id } = req.params;

	Tuition.aggregate([
	{
		$facet: {
			students: [
				{ $match: { _id: ObjectId(_id) } },
				{ $project: { students: 1, _id: 0 } },
				{ $unwind: '$students' },
				{ $replaceRoot: { newRoot: '$students' } }
			],
			courses: [
				{ $match: { _id: ObjectId(_id) } },
				{ $project: { courses: 1, _id: 0 } },
				{ $unwind: '$courses' },
				{ $addFields: { 'courses.batches': { $size: '$courses.batches' } } },
				{ $replaceRoot: { newRoot: '$courses' } }
			],
			batches: [
				{ $match: { _id: ObjectId(_id) } },
				{ $project: { courses: 1, _id: 0 } },
				{ $unwind: '$courses' },
				{ $unwind: '$courses.batches' },
				{ $addFields: { 'courses.batches.schedules': { $size: '$courses.batches.schedules' }, 'courses.batches.courseId': '$courses._id' } },
				{ $replaceRoot: { newRoot: '$courses' } }
			]
		},
	}]).then(data => res.send(data)).catch(err => console.error(err));
});

route.post('/add/:_id/:arrayName', (req, res) => {
	const elementToBePushed = req.body.string || req.body;
	tuitionDbFunctions.addElementToArray({ _id: req.params._id }, req.params.arrayName, elementToBePushed)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.post('/', (req, res) => {
	tuitionDbFunctions.addCollection(req.body).then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/update/:idOfCollection/:arrayName/:idOfNestedObject', (req, res) => {
	tuitionDbFunctions.updateElementInArray({ _id: req.params.idOfCollection }, req.params.arrayName, req.params.idOfNestedObject, req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/:_id', (req, res) => {
	Tuition.findByIdAndUpdate(req.params, req.body, { new: true })
		.then(tuition => res.send(tuition))
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
	tuitionDbFunctions.deleteOneRow(req.params)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

// Get all claimed students
route.get('/student/claimed', (req, res) => {
	if (req.body === undefined) throw new Error('User not logged in!');

	const claimedTuitions = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'tuition') claimedTuitions.push(ObjectId(listingInfo.listingId));
	});

	Tuition.aggregate([
		{ $match: { _id: { $in: claimedTuitions } } },
		{ $project: { students: 1 } },
		{ $unwind: '$students' },
		{ $addFields: { 'students.tuitionId': '$_id' } },
		{ $replaceRoot: { newRoot: '$students' } }
	]).then(students => res.send(students)).catch(err => console.error(err));
});

route.get('/:tuitionId/student', (req, res) => {
	if (req.query._id === undefined) throw new Error('Student id not peovided');
	const { tuitionId } = req.params;
	const studentId = req.query._id;

	Tuition.aggregate([
		{ $match: { _id: ObjectId(tuitionId) } },
		{ $project: { students: 1 } },
		{ $unwind: '$students' },
		{ $match: { 'students._id': ObjectId(studentId) } },
		{ $replaceRoot: { newRoot: '$students' } }
	]).then(data => res.send(data)).catch(err => console.error(err));
});

route.post('/:tuitionId/student', (req, res) => {
	const { tuitionId } = req.params;
	let isArray;
	const idsOfAddedStudents = [];
	let idOfStudentToBeAdded;
	let updateQuery;
	let options;

	if (Array.isArray(req.body.students)) {
		isArray = true;
		req.body.students.forEach(studentToBeAdded => {
			const _id = new ObjectId();
			studentToBeAdded._id = _id;
			idsOfAddedStudents.push(_id.toString());
		});

		if (req.body.batchInfo) {
			if (req.body.batchInfo.courseId === undefined) throw new Error('Course Id not provided');
			if (req.body.batchInfo.batchId === undefined) throw new Error('Course Id not provided');

			const { courseId, batchId } = req.body.batchInfo;

			updateQuery = { $push: { 'students': { $each: req.body.students }, 'courses.$[i].batches.$[j].students': { $each: idsOfAddedStudents } } };
			options = { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }], new: true }
		} else {
			updateQuery = { $push: { students: { $each: req.body.students } } };
			options = { new: true };
		}
	} else {
		isArray = false;
		const _id = new ObjectId();
		idOfStudentToBeAdded = _id;
		req.body._id = _id;

		if (req.body.batchInfo) {
			if (req.body.batchInfo.courseId === undefined) throw new Error('Course Id not provided');
			if (req.body.batchInfo.batchId === undefined) throw new Error('Course Id not provided');

			const { courseId, batchId } = req.body.batchInfo;

			updateQuery = { $push: { 'students': req.body, 'courses.$[i].batches.$[j].students': _id } };
			options = { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }], new: true }
		} else {
			updateQuery = { $push: { 'students': req.body } };
			options = { new: true };
		}
	}

	Tuition.findByIdAndUpdate(tuitionId, updateQuery, options)
		.then(tuition => {
			// FIXME: Make email templates file
			const emailTemplate = `<p>${tuition.name} has added you in their study monitor. Login in to <a href="https://eduatlas.com">Eduatlas</a> to get updates and notifications from your institute.</p>
			<p>To login or signup for FREE click here <a href="https://eduatlas.com">Eduatlas</a></p>`;
			if (isArray) {
				const studentsAdded = tuition.students.filter(student => idsOfAddedStudents.indexOf(student._id.toString()) !== -1);
				res.send(studentsAdded);
				const emailIdsOfStudentsAdded = studentsAdded.map(student => student.email);
				if (isProd) sendMail(emailIdsOfStudentsAdded, 'Add: Study Monitor', emailTemplate);
			} else {
				const studentAdded = _.find(tuition.students, { _id: idOfStudentToBeAdded });
				res.send(studentAdded);
				const studentEmail = studentAdded.email;
				if (isProd) sendMail(studentEmail, 'Add: Study Monitor', emailTemplate);
			}
		}).catch(err => console.error(err));
});

route.put('/:tuitionId/student/:studentId', (req, res) => {
	const { tuitionId, studentId } = req.params;

	prependToObjKey(req.body, 'students.$.')

	Tuition.findOneAndUpdate({ _id: ObjectId(tuitionId), students: { $elemMatch: { _id: ObjectId(studentId) } } }, req.body, { new: true })
		.then(tuition => res.send(_.find(tuition.students, { _id: ObjectId(studentId) })))
		.catch(err => console.error(err));
});

route.delete('/:tuitionId/student/all', (req, res) => {
	const { tuitionId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { students: [] })
		.then(tuition => res.send(tuition.students))
		.catch(err => console.error(err))
});

route.delete('/:tuitionId/student/:studentId', (req, res) => {
	const { tuitionId, studentId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { $pull: { 'students': { _id: ObjectId(studentId) }, 'courses.$[].batches.$[].students': studentId } })
		.then(tuition => {
			// FIXME: Make seperate files for templates
			const studentDeleted = _.find(tuition.students, { _id: ObjectId(studentId) });
			const studentName = titleCase(studentDeleted.name);
			const emailTemplate = `<p>Hi <span style="text-transform: capitalize">${studentDeleted.name}</span></p>
			<p>${tuition.name} has removed you from their study monitor. If this is a mistake, please get in touch with your institution.</p>
			<p>Regards,</p>
			<p>Team Eduatlas.</p>`;
			res.send(studentDeleted);
			if (isProd) sendMail(studentDeleted.email, 'Remove: Study Monitor', emailTemplate);
		}).catch(err => console.error(err));
});

// Student Payment
route.get('/:tuitionId/student/:studentId/payment/all', (req, res) => {
	const { tuitionId, studentId } = req.params;

	Tuition.aggregate([
		{ $match: { _id: ObjectId(tuitionId) } },
		{ $project: { students: 1 } },
		{ $unwind: '$students' },
		{ $match: { 'students._id': ObjectId(studentId) } },
		{ $unwind: '$students.payments' },
		{ $replaceRoot: { newRoot: '$students.payments' } }
	]).then(payments => res.send(payments)).catch(err => console.error(err));
});

route.get('/:tuitionId/student/:studentId/payment/:paymentId', (req, res) => {
	const { tuitionId, studentId, paymentId } = req.params;

	Tuition.aggregate([
		{ $match: { _id: ObjectId(tuitionId) } },
		{ $project: { students: 1 } },
		{ $unwind: '$students' },
		{ $match: { 'students._id': ObjectId(studentId) } },
		{ $unwind: '$students.payments' },
		{ $replaceRoot: { newRoot: '$students.payments' } },
		{ $match: { _id: ObjectId(paymentId) } }
	]).then(payments => res.send(payments)).catch(err => console.error(err));
});

route.post('/:tuitionId/student/:studentId/payment', (req, res) => {
	const { tuitionId, studentId } = req.params;
	const _id = new ObjectId();
	req.body._id = _id;

	Tuition.findOneAndUpdate({ _id: ObjectId(tuitionId), students: { $elemMatch: { _id: studentId } } }, { $push: { 'students.$.payments': req.body } }, { new: true })
		.then(tuition => {
			const student = _.find(tuition.students, { _id: ObjectId(studentId) });
			res.send(_.find(student.payments, { _id }));
		}).catch(err => console.error(err))
});

route.put('/:tuitionId/student/:studentId/payment/:paymentId', (req, res) => {
	const { tuitionId, studentId, paymentId } = req.params;

	prependToObjKey(req.body, 'students.$[i].payments.$[j].');

	Tuition.findByIdAndUpdate(tuitionId, req.body, { arrayFilters: [{ 'i._id': ObjectId(studentId) }, { 'j._id': ObjectId(paymentId) }], new: true })
		.then(tuition => {
			const student = _.find(tuition.students, { _id: ObjectId(studentId) });
			res.send(_.find(student.payments, { _id: ObjectId(paymentId) }));
		}).catch(err => console.error(err));
});

route.delete('/:tuitionId/student/:studentId/payment/all', (req, res) => {
	const { tuitionId, studentId } = req.params;

	Tuition.findOneAndUpdate({ _id: ObjectId(tuitionId), students: { $elemMatch: { _id: ObjectId(studentId) } } }, { 'students.$.payments': [] })
		.then(() => res.send([])).catch(err => console.error(err));
});

route.delete('/:tuitionId/student/:studentId/payment/:paymentId', (req, res) => {
	const { tuitionId, studentId, paymentId } = req.params;

	Tuition.findOneAndUpdate({ _id: ObjectId(tuitionId), students: { $elemMatch: { _id: ObjectId(studentId) } } }, { $pull: { 'students.$.payments': { _id: ObjectId(paymentId) } } })
		.then(tuition => {
			const student = _.find(tuition.students, { _id: ObjectId(studentId) });
			res.send(_.find(student.payments, { _id: ObjectId(paymentId) }));
		}).catch(err => console.error(err));
});

// Student payment installment
route.get('/:tuitionId/student/:studentId/payment/:paymentId/installment/all', (req, res) => {
	const { tuitionId, studentId, paymentId } = req.params;

	Tuition.aggregate([
		{ $match: { _id: ObjectId(tuitionId) } },
		{ $project: { students: 1 } },
		{ $unwind: '$students' },
		{ $match: { 'students._id': ObjectId(studentId) } },
		{ $unwind: '$students.payments' },
		{ $match: { 'students.payments._id': ObjectId(paymentId) } },
		{ $unwind: '$students.payments.installments' },
		{ $replaceRoot: { newRoot: '$students.payments.installments' } }
	]).then(data => res.send(data)).catch(err => console.error(err))
});

route.get('/:tuitionId/student/:studentId/payment/:paymentId/installment/:installmentId', (req, res) => {
	const { tuitionId, studentId, paymentId, installmentId } = req.params;

	Tuition.aggregate([
		{ $match: { _id: ObjectId(tuitionId) } },
		{ $project: { students: 1 } },
		{ $unwind: '$students' },
		{ $match: { 'students._id': ObjectId(studentId) } },
		{ $unwind: '$students.payments' },
		{ $match: { 'students.payments._id': ObjectId(paymentId) } },
		{ $unwind: '$students.payments.installments' },
		{ $match: { 'students.payments.installments._id': ObjectId(installmentId) } },
		{ $replaceRoot: { newRoot: '$students.payments.installments' } }
	]).then(data => res.send(data)).catch(err => console.error(err))
});

route.post('/:tuitionId/student/:studentId/payment/:paymentId/installment', (req, res) => {
	const { tuitionId, studentId, paymentId } = req.params;
	const _id = new ObjectId();
	req.body._id = _id;

	Tuition.findByIdAndUpdate(tuitionId, { $push: { 'students.$[i].payments.$[j].installments': req.body } }, { arrayFilters: [{ 'i._id': ObjectId(studentId) }, { 'j._id': ObjectId(paymentId) }], new: true })
		.then(tuition => {
			const student = _.find(tuition.students, { _id: ObjectId(studentId) });
			const payment = _.find(student.payments, { _id: ObjectId(paymentId) });
			res.send(_.find(payment.installments, { _id }));
		}).catch(err => console.error(err))
});

route.put('/:tuitionId/student/:studentId/payment/:paymentId/installment/:installmentId', (req, res) => {
	const { tuitionId, studentId, paymentId, installmentId } = req.params;

	prependToObjKey(req.body, 'students.$[i].payments.$[j].installments.$[k].');

	Tuition.findByIdAndUpdate(tuitionId, req.body, { arrayFilters: [{ 'i._id': ObjectId(studentId) }, { 'j._id': ObjectId(paymentId) }, { 'k._id': ObjectId(installmentId) }], new: true })
		.then(tuition => {
			const student = _.find(tuition.students, { _id: ObjectId(studentId) });
			const payment = _.find(student.payments, { _id: ObjectId(paymentId) });
			res.send(_.find(payment.installments, { _id: ObjectId(installmentId) }));
		}).catch(err => console.error(err));
});

route.delete('/:tuitionId/student/:studentId/payment/:paymentId/installment/all', (req, res) => {
	const { tuitionId, studentId, paymentId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { 'students.$[i].payments.$[j].installments': [] }, { arrayFilters: [{ 'i._id': ObjectId(studentId) }, { 'j._id': ObjectId(paymentId) }] })
		.then(() => res.send([])).catch(err => console.error(err))
});

route.delete('/:tuitionId/student/:studentId/payment/:paymentId/installment/:installmentId', (req, res) => {
	const { tuitionId, studentId, paymentId, installmentId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { $pull: { 'students.$[i].payments.$[j].installments': { _id: ObjectId(installmentId) } } }, { arrayFilters: [{ 'i._id': ObjectId(studentId) }, { 'j._id': ObjectId(paymentId) }] })
		.then(tuition => {
			const student = _.find(tuition.students, { _id: ObjectId(studentId) });
			const payment = _.find(student.payments, { _id: ObjectId(paymentId) });
			res.send(_.find(payment.installments, { _id: ObjectId(installmentId) }));
		}).catch(err => console.error(err));
});

// Courses
route.get('/:tuitionId/course/all', (req, res) => {
	const { tuitionId } = req.params;
	Tuition.findById(tuitionId).select('courses')
		.then(tuition => res.send(tuition.courses))
		.catch(err => console.error(err));
});

route.get('/course/claimed', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');
	const claimedTuitions = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'tuition') claimedTuitions.push(ObjectId(listingInfo.listingId));
	});

	Tuition.aggregate([
		{ $match: { _id: { $in: claimedTuitions } } },
		{ $project: { courses: 1 } },
		{ $unwind: '$courses' },
		{ $addFields: { 'courses.tuitionId': '$_id' } },
		{ $project: { _id: false } },
		{ $replaceRoot: { newRoot: '$courses' } }
	]).then(courses => res.send(courses)).catch(err => console.error(err))
})

route.get('/:tuitionId/course', (req, res) => {
	const { tuitionId } = req.params;
	const courseId = req.query._id;
	Tuition.findById(tuitionId).select('courses')
		.then(tuition => res.send(_.find(tuition.courses, { _id: ObjectId(courseId) })))
		.catch(err => console.error(err));
});

route.post('/:tuitionId/course', (req, res) => {
	const { tuitionId } = req.params;
	const _id = new ObjectId();
	req.body._id = _id;

	Tuition.findByIdAndUpdate(tuitionId, { $push: { courses: req.body } }, { new: true })
		.then(tuition => res.send(_.find(tuition.courses, { _id })))
		.catch(err => console.error(err));
});

route.put('/:tuitionId/course/:courseId', (req, res) => {
	const { tuitionId, courseId } = req.params;

	prependToObjKey(req.body, 'courses.$.');

	// Mongoose automaticly calls $set for object in second argument
	Tuition.findOneAndUpdate({ '_id': tuitionId, 'courses._id': courseId }, req.body, { new: true })
		.then(tuition => res.send(_.find(tuition.courses, { _id: ObjectId(courseId) })))
		.catch(err => console.error(err));
});

route.delete('/:tuitionId/course/:courseId', (req, res) => {
	const { tuitionId, courseId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { $pull: { courses: { _id: courseId } } })
		.then(tuition => res.send(_.find(tuition.courses, { _id: ObjectId(courseId) }))).catch(err => console.error(err))
});

// Batches
route.get('/:tuitionId/batch/all', (req, res) => {
	const { tuitionId } = req.params;

	Tuition.aggregate([
		{ $match: { _id: ObjectId(tuitionId) } },
		{ $project: { courses: 1 } },
		{ $unwind: '$courses' },
		{ $unwind: '$courses.batches' },
		{ $project: { _id: '$courses.batches._id', courseId: '$courses._id', courseCode: '$courses.code', code: '$courses.batches.code', description: '$courses.batches.description', numberOfStudents: { $size: '$courses.batches.students' } } }
	]).then(batch => res.send(batch)).catch(err => console.error(err));
});

route.get('/batch/claimed', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	const claimedTuitions = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'tuition') claimedTuitions.push(ObjectId(listingInfo.listingId));
	});

	Tuition.aggregate([
		{ $match: { _id: { $in: claimedTuitions } } },
		{ $project: { courses: 1 } },
		{ $unwind: '$courses' },
		{ $unwind: '$courses.batches' },
		{ $addFields: { 'courses.batches.tuitionId': '$_id', 'courses.batches.courseId': '$courses._id', 'courses.batches.courseCode': '$courses.code' } },
		{ $replaceRoot: { newRoot: '$courses.batches' } }
	]).then(data => res.send(data)).catch(err => console.error(err));
});

route.get('/:tuitionId/batch', (req, res) => {
	if (req.query._id === undefined) throw new Error('Batch id not provided')

	const { tuitionId } = req.params;
	const batchId = req.query._id;

	Tuition.aggregate([
		{ $match: { _id: ObjectId(tuitionId) } },
		{ $project: { courses: 1 } },
		{ $unwind: '$courses' },
		{ $unwind: '$courses.batches' },
		{ $match: { 'courses.batches._id': ObjectId(batchId) } }
	]).then(batchArr => batchArr.length === 1 ? res.send(batchArr[0]) : res.status(400).end()).catch(err => console.error(err));
});

route.post('/:tuitionId/course/:courseId/batch', (req, res) => {
	const { tuitionId, courseId } = req.params;
	const _id = new ObjectId();
	req.body._id = _id;

	if (typeof req.body.students === 'string') req.body.students = [req.body.students];

	Tuition.findOneAndUpdate({ '_id': tuitionId, 'courses._id': courseId }, { $push: { 'courses.$.batches': req.body } }, { new: true })
		.then(tuition => {
			const course = _.find(tuition.courses, { _id: ObjectId(courseId) });
			res.send(_.find(course.batches, { _id }))
		}).catch(err => console.error(err))
});

route.put('/:tuitionId/course/:courseId/batch/:batchId', (req, res) => {
	const { tuitionId, courseId, batchId } = req.params;

	//FIXME: Implement this diffently on frontend
	if (typeof req.body.students === 'string') req.body.students = [req.body.students];
	if (req.body.students === undefined) req.body.students = [];

	prependToObjKey(req.body, 'courses.$[i].batches.$[j].');

	Tuition.findByIdAndUpdate(tuitionId, req.body, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }], new: true })
		.then(tuition => {
			const course = _.find(tuition.courses, { _id: ObjectId(courseId) });
			res.send(_.find(course.batches, { _id: ObjectId(batchId) }));
		}).catch(err => console.error(err));
});

route.delete('/:tuitionId/course/:courseId/batch/:batchId', (req, res) => {
	const { tuitionId, courseId, batchId } = req.params;

	Tuition.findOneAndUpdate({ '_id': tuitionId, 'courses._id': courseId }, { $pull: { 'courses.$.batches': { _id: batchId } } })
		.then(tuition => {
			const course = _.find(tuition.courses, { _id: ObjectId(courseId) });
			res.send(_.find(course.batches, { _id: ObjectId(batchId) }));
		}).catch(err => console.error(err))
});

route.post('/:tuitionId/course/:courseId/batch/:batchId/student', (req, res) => {
	const { tuitionId, courseId, batchId } = req.params;
	// Can't think of a better name
	const removeElements = Array.isArray(req.body.students) ? { $each: req.body.students } : req.body.students;

	Tuition.findByIdAndUpdate(tuitionId, { $push: { 'courses.$[i].batches.$[j].students': removeElements } }, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }], new: true })
		.then(tuition => {
			const course = _.find(tuition.courses, { _id: ObjectId(courseId) });
			const batch = _.find(course.batches, { _id: ObjectId(batchId) });
			res.send(batch.students);
		}).catch(err => console.error(err))
});

route.delete('/:tuitionId/course/:courseId/batch/:batchId/student', (req, res) => {
	const { tuitionId, courseId, batchId } = req.params;
	const pullQuery = Array.isArray(req.body.students) ? { $pullAll: { 'courses.$[i].batches.$[j].students': req.body.students } } : { $pull: { 'courses.$[i].batches.$[j].students': req.body.students } };

	Tuition.findByIdAndUpdate(tuitionId, pullQuery, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }], new: true })
		.then(tuition => {
			const course = _.find(tuition.courses, { _id: ObjectId(courseId) });
			const batch = _.find(course.batches, { _id: ObjectId(batchId) });
			res.send(batch.students);
		}).catch(err => console.error(err));
});

route.delete('/:tuitionId/course/:courseId/batch/:batchId/student/empty', (req, res) => {
	const { tuitionId, courseId, batchId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { 'courses.$[i].batches.$[j].students': [] }, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }] })
		.then(() => res.send([]).catch(err => console.error(err)));
});

// Schedule
route.get('/schedule/claimed', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	const claimedTuitions = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'tuition') claimedTuitions.push(ObjectId(listingInfo.listingId));
	});

	Tuition.aggregate([
		{ $match: { _id: { $in: claimedTuitions } } },
		{ $project: { courses: 1 } },
		{ $unwind: '$courses' },
		{ $unwind: '$courses.batches' },
		{ $unwind: '$courses.batches.schedules' },
		{ $addFields: { 'courses.batches.schedules.tuitionId': '$_id', 'courses.batches.schedules.courseId': '$courses._id', 'courses.batches.schedules.courseCode': '$courses.code', 'courses.batches.schedules.batchId': '$courses.batches._id', 'courses.batches.schedules.batchCode': '$courses.batches.code' } },
		{ $replaceRoot: { newRoot: '$courses.batches.schedules' } }
	]).then(schedules => res.send(schedules)).catch(err => console.error(err));
});

route.post('/:tuitionId/course/:courseId/batch/:batchId/schedule', (req, res) => {
	const { tuitionId, courseId, batchId } = req.params;
	let _idArr = [];
	let isReqArray;
	let pushQuery;
	if (Array.isArray(req.body.schedules)) {
		isReqArray = true;
		req.body.schedules.forEach(schedule => {
			const _id = new ObjectId();
			_idArr.push(_id);
			schedule._id = _id;
		});
		pushQuery = { $each: req.body.schedules };
	} else {
		isReqArray = false;
		const _id = new ObjectId();
		req.body._id = _id;
		pushQuery = req.body;
	}

	const _id = new ObjectId();
	req.body._id = _id;

	Tuition.findByIdAndUpdate(tuitionId, { $push: { 'courses.$[i].batches.$[j].schedules': pushQuery } }, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }], new: true })
		.then(tuition => {
			const course = _.find(tuition.courses, { _id: ObjectId(courseId) });
			const batch = _.find(course.batches, { _id: ObjectId(batchId) });

			let schedulesAdded;
			if (isReqArray) {
				//Making sure all object ids are converted to strings for comparison
				_idArr = _idArr.map(_idElement => _idElement.toString());
				// Can't change object key in batches.schedule because of some mongoose object bullshit
				schedulesAdded = batch.schedules.filter(schedule => _idArr.indexOf(schedule._id.toString()) !== -1);
			} else {
				schedulesAdded = _.find(batch.schedules, { _id });
			}
			res.send(schedulesAdded);
		}).catch(err => console.error(err));
});

route.put('/:tuitionId/course/:courseId/batch/:batchId/schedule/:scheduleId', (req, res) => {
	const { tuitionId, courseId, batchId, scheduleId } = req.params;

	prependToObjKey(req.body, 'courses.$[i].batches.$[j].schedules.$[k].')

	Tuition.findByIdAndUpdate(tuitionId, req.body, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }, { 'k._id': ObjectId(scheduleId) }], new: true })
		.then(tuition => {
			const course = _.find(tuition.courses, { _id: ObjectId(courseId) });
			const batch = _.find(course.batches, { _id: ObjectId(batchId) });
			res.send(_.find(batch.schedules, { _id: ObjectId(scheduleId) }));
		}).catch(err => console.error(err));
});

route.delete('/:tuitionId/course/:courseId/batch/:batchId/schedule/:scheduleId', (req, res) => {
	const { tuitionId, courseId, batchId, scheduleId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { $pull: { 'courses.$[i].batches.$[j].schedules': { _id: scheduleId } } }, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }] })
		.then(tuition => {
			const course = _.find(tuition.courses, { _id: ObjectId(courseId) });
			const batch = _.find(course.batches, { _id: ObjectId(batchId) });
			res.send(_.find(batch.schedules, { _id: ObjectId(scheduleId) }));
		}).catch(err => console.error(err));
});

// Attendance
route.post('/:tuitionId/course/:courseId/batch/:batchId/schedule/:scheduleId/student-absent/new', (req, res) => {
	const { tuitionId, courseId, batchId, scheduleId } = req.params;

	if (req.body.absentees === undefined) {
		req.body.absentees = [];
	} else if (Array.isArray(req.body.absentees) === false) {
		req.body.absentees = [req.body.absentees];
	}

	Tuition.findByIdAndUpdate(tuitionId, { 'courses.$[i].batches.$[j].schedules.$[k].studentsAbsent': req.body.absentees }, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }, { 'k._id': ObjectId(scheduleId) }], new: true })
		.then(tuition => {
			const course = _.find(tuition.courses, { _id: ObjectId(courseId) });
			const batch = _.find(course.batches, { _id: ObjectId(batchId) });
			const schedule = _.find(batch.schedules, { _id: ObjectId(scheduleId) });
			res.send(schedule.studentsAbsent);
		}).catch(err => console.error(err));
});

route.post('/:tuitionId/course/:courseId/batch/:batchId/schedule/:scheduleId/student-absent', (req, res) => {
	if (req.body.absentees === undefined) {
		res.send([]);
		return;
	}
	const { tuitionId, courseId, batchId, scheduleId } = req.params;
	if (Array.isArray(req.body.absentees) === false) req.body.absentees = [req.body.absentees];

	Tuition.findByIdAndUpdate(tuitionId, { $push: { 'courses.$[i].batches.$[j].schedules.$[k].studentsAbsent': { $each: req.body.absentees } } }, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }, { 'k._id': ObjectId(scheduleId) }], new: true })
		.then(tuition => {
			const course = _.find(tuition.courses, { _id: ObjectId(courseId) });
			const batch = _.find(course.batches, { _id: ObjectId(batchId) });
			const schedule = _.find(batch.schedules, { _id: ObjectId(scheduleId) });
			res.send(schedule.studentsAbsent);
		}).catch(err => console.error(err));
});

route.delete('/:tuitionId/course/:courseId/batch/:batchId/schedule/:scheduleId/student-absent/empty', (req, res) => {
	const { tuitionId, courseId, batchId, scheduleId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { 'courses.$[i].batches.$[j].schedules.$[k].studentsAbsent': [] }, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }, { 'k._id': ObjectId(scheduleId) }], new: true })
		.then(() => res.send([])).catch(err => console.error(err));
});

route.delete('/:tuitionId/course/:courseId/batch/:batchId/schedule/:scheduleId/student-absent', (req, res) => {
	const { tuitionId, courseId, batchId, scheduleId } = req.params;
	const pullQuery = Array.isArray(req.body.absentees) ? { $pullAll: { 'courses.$[i].batches.$[j].schedules.$[k].studentsAbsent': req.body.absentees } } : { $pull: { 'courses.$[i].batches.$[j].schedules.$[k].studentsAbsent': req.body._id } };

	Tuition.findByIdAndUpdate(tuitionId, pullQuery, { arrayFilters: [{ 'i._id': ObjectId(courseId) }, { 'j._id': ObjectId(batchId) }, { 'k._id': ObjectId(scheduleId) }], new: true })
		.then(tuition => {
			const course = _.find(tuition.courses, { _id: ObjectId(courseId) });
			const batch = _.find(course.batches, { _id: ObjectId(batchId) });
			const schedule = _.find(batch.schedules, { _id: ObjectId(scheduleId) });
			res.send(schedule.studentsAbsent);
		}).catch(err => console.error(err));
});

// Fourm
route.get('/forum/claimed', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	const claimedTuitions = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'tuition') claimedTuitions.push(ObjectId(listingInfo.listingId));
	});

	Tuition.aggregate([
		{ $match: { _id: { $in: claimedTuitions } } },
		{ $project: { forums: 1 } },
		{ $unwind: '$forums' },
		{ $addFields: { 'forums.tuitionId': '$_id' } },
		{ $replaceRoot: { newRoot: '$forums' } }
	]).then(forums => res.send(forums)).catch(err => console.error(err));
})

route.get('/:tuitionId/forum', (req, res) => {
	const { tuitionId } = req.params;

	Tuition.findById(tuitionId).select('forums')
		.then(tuition => res.send(tuition.forums)).catch(err => console.error(err));
});

route.post('/:tuitionId/forum', (req, res) => {
	const { tuitionId } = req.params;

	const _id = new ObjectId();
	req.body._id = _id;

	Tuition.findByIdAndUpdate(tuitionId, { $push: { forums: req.body } }, { new: true })
		.then(tuition => res.send(_.find(tuition.forums, { _id })))
		.catch(err => console.error(err));
});

route.put('/:tuitionId/forum/:forumId', (req, res) => {
	const { tuitionId, forumId } = req.params;

	prependToObjKey(req.body, 'forums.$.');

	Tuition.findOneAndUpdate({ _id: tuitionId, forums: { $elemMatch: { _id: forumId } } }, req.body, { new: true })
		.then(tuition => res.send(_.find(tuition.forums, { _id: ObjectId(forumId) })))
		.catch(err => console.error(err));
});

route.delete('/:tuitionId/forum/:forumId', (req, res) => {
	const { tuitionId, forumId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { $pull: { forums: { _id: forumId } } })
		.then(tuition => res.send(_.find(tuition.forums, { _id: ObjectId(forumId) })))
		.catch(err => console.error(err));
});

// Forum comment
route.post('/:tuitionId/forum/:forumId/comment', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	const { tuitionId, forumId } = req.params;
	const _id = new ObjectId();
	req.body._id = _id;
	req.body.userEmail = req.user.primaryEmail;

	Tuition.findOneAndUpdate({ _id: ObjectId(tuitionId), forums: { $elemMatch: { _id: ObjectId(forumId) } } }, { $push: { 'forums.$.comments': req.body } }, { new: true })
		.then(tuition => {
			const forum = _.find(tuition.forums, { _id: ObjectId(forumId) });
			res.send(_.find(forum.comments, { _id }))
		}).catch(err => console.error(err));
});

route.put('/:tuitionId/forum/:forumId/comment/:commentId', (req, res) => {
	const { tuitionId, forumId, commentId } = req.params;

	prependToObjKey(req.body, 'forums.$[i].comments.$[j]');

	Tuition.findByIdAndUpdate(tuitionId, req.body, { arrayFilters: [{ 'i._id': ObjectId(forumId) }, { 'j._id': ObjectId(commentId) }], new: true })
		.then(tuition => {
			const forum = _.find(tuition.forums, { _id: ObjectId(forumId) });
			res.send(_.find(forum.comments, { _id: ObjectId(commentId) }))
		}).catch(err => console.error(err));
});

route.delete('/:tuitionId/forum/:forumId/comment/:commentId', (req, res) => {
	const { tuitionId, forumId, commentId } = req.params;

	Tuition.findOneAndUpdate({ _id: tuitionId, forums: { $elemMatch: { _id: forumId } } }, { $pull: { 'forums.$.comments': { _id: commentId } } })
		.then(tuition => {
			const forum = _.find(tuition.forums, { _id: ObjectId(forumId) });
			res.send(_.find(forum.comments, { _id: ObjectId(commentId) }))
		}).catch(err => console.error(err));
});

// Leads
route.get('/lead/claimed', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	const claimedTuitions = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'tuition') claimedTuitions.push(ObjectId(listingInfo.listingId));
	});

	Tuition.aggregate([
		{ $match: { _id: { $in: claimedTuitions } } },
		{ $project: { leads: 1 } },
		{ $unwind: '$leads' },
		{ $addFields: { 'leads.tuitionId': '$_id' } },
		{ $replaceRoot: { newRoot: '$leads' } }
	]).then(leads => res.send(leads)).catch(err => console.error(err));
});

route.get('/:tuitionId/lead', (req, res) => {
	const { tuitionId } = req.params;

	Tuition.findById(tuitionId).select('leads')
		.then(tuition => res.send(tuition.leads)).catch(err => console.error(err));
});

route.post('/:tuitionId/lead', (req, res) => {
	const { tuitionId } = req.params;

	const _id = new ObjectId();
	req.body._id = _id;

	Tuition.findByIdAndUpdate(tuitionId, { $push: { leads: req.body } }, { new: true })
		.then(tuition => res.send(_.find(tuition.leads, { _id })))
		.catch(err => console.error(err));
});

route.put('/:tuitionId/lead/:leadId', (req, res) => {
	const { tuitionId, leadId } = req.params;

	prependToObjKey(req.body, 'leads.$.');

	Tuition.findOneAndUpdate({ _id: tuitionId, leads: { $elemMatch: { _id: leadId } } }, req.body, { new: true })
		.then(tuition => res.send(_.find(tuition.leads, { _id: ObjectId(leadId) })))
		.catch(err => console.error(err));
});

route.delete('/:tuitionId/lead/:leadId', (req, res) => {
	const { tuitionId, leadId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { $pull: { leads: { _id: leadId } } })
		.then(tuition => res.send(_.find(tuition.leads, { _id: ObjectId(leadId) })))
		.catch(err => console.error(err));
});

// Lead comment
// Also updates next followup and status
route.post('/:tuitionId/lead/:leadId/comment', (req, res) => {
	const { tuitionId, leadId } = req.params;

	const comment = req.body.comment;
	const _id = new ObjectId();
	comment._id = _id;
	delete req.body.comment;

	prependToObjKey(req.body, 'leads.$.');

	Tuition.findOneAndUpdate({ _id: ObjectId(tuitionId), leads: { $elemMatch: { _id: ObjectId(leadId) } } }, { $push: { 'leads.$.comments': comment }, $set: req.body }, { new: true })
		.then(tuition => {
			const leads = _.find(tuition.leads, { _id: ObjectId(leadId) });
			res.send(_.find(leads.comments, { _id }))
		}).catch(err => console.error(err));
});

route.put('/:tuitionId/lead/:leadId/comment/:commentId', (req, res) => {
	const { tuitionId, leadId, commentId } = req.params;

	prependToObjKey(req.body, 'leads.$[i].comments.$[j].');

	Tuition.findByIdAndUpdate(tuitionId, req.body, { arrayFilters: [{ 'i._id': ObjectId(leadId) }, { 'j._id': ObjectId(commentId) }], new: true })
		.then(tuition => {
			const lead = _.find(tuition.leads, { _id: ObjectId(leadId) });
			res.send(_.find(lead.comments, { _id: ObjectId(commentId) }))
		}).catch(err => console.error(err));
});

route.delete('/:tuitionId/lead/:leadId/comment/:commentId', (req, res) => {
	const { tuitionId, leadId, commentId } = req.params;

	Tuition.findOneAndUpdate({ _id: tuitionId, leads: { $elemMatch: { _id: ObjectId(leadId) } } }, { $pull: { 'leads.$.comments': { _id: commentId } } })
		.then(tuition => {
			const lead = _.find(tuition.leads, { _id: ObjectId(leadId) });
			res.send(_.find(lead.comments, { _id: ObjectId(commentId) }))
		}).catch(err => console.error(err));
});

// Notification
route.get('/notification/claimed', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	const claimedTuitions = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'tuition') claimedTuitions.push(ObjectId(listingInfo.listingId));
	});

	Notification.aggregate([
		{ $match: { senderId: { $in: claimedTuitions } } },
	]).then(notification => res.send(notification)).catch(err => console.error(err));
});

// Discount
route.get('/:tuitionId/discount/all', (req, res) => {
	const { tuitionId } = req.params;

	Tuition.findById(tuitionId).select('discounts')
		.then(tuition => res.send(tuition.discounts)).catch(err => console.error(err))
});

route.get('/discount/claimed', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');

	const claimedTuitions = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'tuition') claimedTuitions.push(ObjectId(listingInfo.listingId));
	});

	Tuition.aggregate([
		{ $match: { _id: { $in: claimedTuitions } } },
		{ $unwind: '$discounts' },
		{ $addFields: { 'discounts.tuitionId': '$_id' } },
		{ $replaceRoot: { newRoot: '$discounts' } }
	]).then(discounts => res.send(discounts)).catch(err => console.error(err));
});

route.get('/:tuitionId/discount', (req, res) => {
	const { tuitionId } = req.params;

	Tuition.aggregate([
		{ $match: { _id: ObjectId(tuitionId) } },
		{ $project: { discounts: 1 } },
		{ $unwind: '$discounts' },
		{ $match: { 'discounts._id': ObjectId(req.query._id) } },
		{ $replaceRoot: { newRoot: '$discounts' } }
	]).then(discount => res.send(discount)).catch(err => console.error(err));
});

route.post('/:tuitionId/discount', (req, res) => {
	const { tuitionId } = req.params;
	const _id = new ObjectId();
	req.body._id = _id

	Tuition.findByIdAndUpdate(tuitionId, { $push: { discounts: req.body } }, { new: true })
		.then(tuition => res.send(_.find(tuition.discounts, { _id })))
		.catch(err => console.error(err))
});

route.put('/:tuitionId/discount/:discountId', (req, res) => {
	const { tuitionId, discountId } = req.params;
	prependToObjKey(req.body, 'discounts.$.')

	Tuition.findOneAndUpdate({ _id: ObjectId(tuitionId), discounts: { $elemMatch: { _id: ObjectId(discountId) } } }, req.body, { new: true })
		.then(tuition => res.send(_.find(tuition.discounts, { _id: ObjectId(discountId) })))
		.catch(err => console.error(err))
});

route.delete('/:tuitionId/discount/all', (req, res) => {
	const { tuitionId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { discounts: [] })
		.then(() => res.send([])).catch(err => console.error(err))
});

route.delete('/:tuitionId/discount/:discountId', (req, res) => {
	const { tuitionId, discountId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { $pull: { discounts: { _id: ObjectId(discountId) } } })
		.then(tuition => res.send(_.find(tuition.discounts, { _id: ObjectId(discountId) })))
		.catch(err => console.error(err))
});

route.post('/:tuitionId/mail', (req, res) => {
	const { tuitionId } = req.params;
	let { name, phoneNumber, email, message } = req.body;

	name = name || 'not provided';
	phoneNumber = phoneNumber || 'not provided';
	email = email || 'not provided';
	message = message || 'not provided';

	const mailTemplate = `<p>${name} wants to connect with you</p>
	<p>Phone Number- ${phoneNumber}</p>
	<p>Email- ${email}</p>
	<p>Message- ${message}</p>
	`;

	Tuition.findById(tuitionId).select('email').then(tuition => {
		const emailOfTuition = tuition.email;
		sendMail(emailOfTuition, 'Lead', mailTemplate);
		res.end();
	});
});

// Resources
route.get('/:tuitionId/reesource/all', (req, res) => {
	const { tuitionId } = req.params;
	Tuition.findById(tuitionId).select('resources')
		.then(tuition => res.send(tuition.resources))
		.catch(err => console.error(err));
});

route.get('/resource/claimed', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');
	const claimedTuitions = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'tuition') claimedTuitions.push(ObjectId(listingInfo.listingId));
	});

	Tuition.aggregate([
		{ $match: { _id: { $in: claimedTuitions } } },
		{ $project: { resources: 1 } },
		{ $unwind: '$resources' },
		{ $addFields: { 'resources.tuitionId': '$_id' } },
		{ $project: { _id: false } },
		{ $replaceRoot: { newRoot: '$resources' } }
	]).then(resources => res.send(resources)).catch(err => console.error(err))
})

route.get('/:tuitionId/resource', (req, res) => {
	const { tuitionId } = req.params;
	const resourceId = req.query._id;
	Tuition.findById(tuitionId).select('resources')
		.then(tuition => res.send(_.find(tuition.resources, { _id: ObjectId(resourceId) })))
		.catch(err => console.error(err));
});

// FIXME: Memory leak if someone sends files with different input name
// FIXME: Unwanted parameters in req.body
route.post('/:tuitionId/resource', (req, res) => {
	const { tuitionId } = req.params;

	const _id = new ObjectId();
	req.body._id = _id;

	if (req.body.type !== 'video') {
		if (req.files.length === 0) throw new Error('No rosource found');
		req.body.path = req.files[0].path;
	}

	Tuition.findByIdAndUpdate(tuitionId, { $push: { resources: req.body } }, { new: true })
		.then(tuition => res.send(_.find(tuition.resources, { _id })))
		.catch(err => console.error(err));
});

route.put('/:tuitionId/resource/:resourceId', (req, res) => {
	const { tuitionId, resourceId } = req.params;

	prependToObjKey(req.body, 'resources.$.');

	// Mongoose automaticly calls $set for object in second argument
	Tuition.findOneAndUpdate({ '_id': tuitionId, 'resources._id': resourceId }, req.body, { new: true })
		.then(tuition => res.send(_.find(tuition.resources, { _id: ObjectId(resourceId) })))
		.catch(err => console.error(err));
});

// FIXME: Handle the case of delete file failure
route.delete('/:tuitionId/resource/:resourceId', (req, res) => {
	const { tuitionId, resourceId } = req.params;

	Tuition.findByIdAndUpdate(tuitionId, { $pull: { resources: { _id: resourceId } } })
		.then(tuition => {
			const deletedResource = _.find(tuition.resources, { _id: ObjectId(resourceId) });
			// Test
			res.send(deletedResource);
			return deleteThisShit(path.join(process.cwd(), deletedResource.path));
		}).catch(err => console.error(err))
});

route.post('/email-reciept', (req, res) => {
	if (req.body.docDef === undefined) throw new Error('Document defination not provided');
	if (req.body.email === undefined) throw new Error('Email not provided');

	sendReciept(req.body.email, JSON.parse(req.body.docDef)).then(data => res.send(data)).catch(err => console.error(err));
});

module.exports = route;
