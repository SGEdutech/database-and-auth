const route = require('express').Router();
const Notification = require('../models/notification');
const DbAPIClass = require('../api-functions');
const notificationDbFunctions = new DbAPIClass(Notification);

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
	// if (req.user === undefined) throw new Error('User not logged in');
	// const userEmail = req.user.primaryEmail;
	const userEmail = 'ash';

	Notification.find({ receivers: { $all: { $elemMatch: { userEmail } } } })
		.then(data => res.send(data)).catch(err => console.error(err));
})

route.post('/', (req, res) => {
	if (Array.isArray(req.body.receivers) === false) req.body.receivers = [req.body.receivers];

	req.body.receivers.forEach((userEmail, index) => req.body.receivers[index] = { userEmail });

	Notification.create(req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.put('/user-read', (req, res) => {
	const idsOfNotificationsToBeMarkedAsRead = req.body.ids;

	Notification.find({ _id: { $in: idsOfNotificationsToBeMarkedAsRead } })
})

module.exports = route;
