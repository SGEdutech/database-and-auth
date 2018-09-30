const route = require('express').Router();
const Notification = require('../models/notification');
const Tuition = require('../models/tuition');
const DbAPIClass = require('../api-functions');
const notificationDbFunctions = new DbAPIClass(Notification);

/**
 * Returns student's email id of whole institute or a batch
 * @param {string} instituteId Id of institute
 * @param {string} [batchId] Id of batch
 * @returns {Promise} Resolves to array of email ids
 */
async function getEmailIds(instituteId, batchId) {
	try {
		const emailIds = [];
		if (instituteId === undefined) return emailIds;

		const institute = await Tuition.findById(instituteId).select('students courses');

		if (batchId) {
			institute.courses.forEach(course => {
				course.batches.forEach(batch => {
					if (batch._id.toString() === batchId) {
						batch.students.forEach(student => {
							institute.students.forEach(instituteStudent => {
								if (instituteStudent._id.toString() === student.toString()) {
									emailIds.push(instituteStudent.email);
								}
							})
						})
					}
				})
			})
			return emailIds;
		}
		institute.students.forEach(student => emailIds.push(student.email));
		return emailIds;
	} catch (err) {
		return new Promise((__, reject) => reject(err));
	}
}

route.get('/all', (req, res) => {
	notificationDbFunctions.getAllData(req.query.demands)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/', (req, res) => {
	notificationDbFunctions.getSpecificData(req.query)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/user-notification', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');
	const userEmail = req.user.primaryEmail;

	Notification.find({ receivers: { $all: { $elemMatch: { userEmail } } } })
		.then(data => res.send(data)).catch(err => console.error(err));
});

route.post('/', (req, res) => {
	let userEmails = [];

	if (req.body.receivers) {
		if (Array.isArray(req.body.receivers) === false) {
			userEmails.push(req.body.receivers);
		} else {
			userEmails = req.user.receivers;
		}
	}

	getEmailIds(req.body.instituteId, req.body.batchId)
		.then(allEmails => {
			userEmails = userEmails.concat(allEmails);
			delete req.body.receivers;
			req.body.receivers = [];
			userEmails.forEach(userEmail => req.body.receivers.push({ userEmail }));
			return Notification.create(req.body);
		}).then(data => res.send(data)).catch(err => console.error(err));
});

route.put('/user-read', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');
	const idsOfNotificationsToBeMarkedAsRead = req.body.ids;
	const userEmail = req.user.primaryEmail;

	Notification.updateMany({ _id: { $in: idsOfNotificationsToBeMarkedAsRead }, receivers: { $elemMatch: { userEmail } } }, { 'receivers.$.readAt': Date.now() })
		.then(data => res.send(data)).catch(err => console.error(err))
})

module.exports = route;
