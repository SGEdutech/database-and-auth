const route = require('express').Router();
const { ObjectId } = require('mongoose').Types;
const Notification = require('../models/notification');
const Tuition = require('../models/tuition');
const DbAPIClass = require('../api-functions');
const notificationDbFunctions = new DbAPIClass(Notification);

route.get('/claimed', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');
	const claimedTuitions = [];
	req.user.claims.forEach(listingInfo => {
		if (listingInfo.listingCategory === 'tuition') claimedTuitions.push(ObjectId(listingInfo.listingId));
	});

	Notification.aggregate([
		{ $match: { senderId: { $in: claimedTuitions } } }
	]).then(notification => res.send(notification)).catch(err => console.error(err))
});

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
	if (req.body.receivers === undefined) throw new Error('Recievers not provided');
	if (Array.isArray(req.body.receivers) === false) throw new Error('Recievers is not an array');
	req.body.receivers = req.body.receivers.map(reciever => {
		return { userEmail: reciever };
	});

	Notification.create(req.body).then(newNotification => res.send(newNotification)).catch(err => console.error(err));
});

route.put('/user-read', (req, res) => {
	if (req.user === undefined) throw new Error('User not logged in');
	const idsOfNotificationsToBeMarkedAsRead = req.body.ids;
	const userEmail = req.user.primaryEmail;

	Notification.updateMany({ _id: { $in: idsOfNotificationsToBeMarkedAsRead }, receivers: { $elemMatch: { userEmail } } }, { 'receivers.$.readAt': Date.now() })
		.then(data => res.send(data)).catch(err => console.error(err))
});

route.delete('/all', (req, res) => {
	Notification.deleteMany({}).then(data => res.send(data)).catch(err => console.error(err));
});

module.exports = route;
