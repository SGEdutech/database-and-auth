const route = require('express').Router();
const Notification = require('../models/notification');
const DbAPIClass = require('../api-functions');
const notificationDbFunctions = new DbAPIClass(Notification);

route.get('/all', (req, res) => {
	const skip = (req.query.page - 1) * req.query.items;
	const limit = parseInt(req.query.items, 10);
	notificationDbFunctions.getAllData(req.query.demands, skip, limit)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/', (req, res) => {
	notificationDbFunctions.getSpecificData(req.query)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

route.get('/user-notification', (req, res) => {
	const userEmail = req.user.primaryEmail;

	Notification.findOne({ 'receivers': { $elemMatch: { userEmail } } })
		.then(data => res.send(data)).catch(err => console.error(err));
})

route.post('/', (req, res) => {
	if (Array.isArray(req.body.recievers) === undefined) throw new Error('Recievers not an array or not provided at all');
	req.body.receivers.forEach((userEmail, index) => {
		req.body.receivers[index] = { userEmail };
	})

	notificationDbFunctions.addCollection(req.body)
		.then(data => res.send(data))
		.catch(err => console.error(err));
});

module.exports = route;
