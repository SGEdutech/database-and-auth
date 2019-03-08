const axios = require('axios');
const { authorizationKey, projectId } = require('../config.json').FIREBASE;

const config = {
	headers: {
		'Content-Type': 'application/json',
		'Authorization': `key=${authorizationKey}`,
		'project_id': projectId
	}
};

async function addRegestrationIdToGroup(notificationKey, notificationKeyName, registrationToken) {
	const data = {
		operation: 'add',
		notification_key: notificationKey,
		notification_key_name: notificationKeyName,
		registration_ids: [registrationToken]
	};
	const response = await axios.post('https://android.googleapis.com/gcm/notification', data, config);
	return response.data;
}

async function createNotificationGroup(notificationKeyName, registrationToken) {
	const data = {
		operation: 'create',
		notification_key_name: notificationKeyName,
		registration_ids: [registrationToken]
	};
	const response = await axios.post('https://android.googleapis.com/gcm/notification', data, config);
	return response.data;
}

async function getNotificationKey(notificationKeyName) {
	const response = await axios.get(`https://fcm.googleapis.com/fcm/notification?notification_key_name=${notificationKeyName}`, config);
	return response.data;
}

async function removeRegestrationIdFromGroup(notificationKey, notificationKeyName, registrationToken) {
	const data = {
		operation: 'remove',
		notification_key: notificationKey,
		notification_key_name: notificationKeyName,
		registration_ids: [registrationToken]
	};
	const response = await axios.post('https://android.googleapis.com/gcm/notification', data, config);
	return response.data;
}

async function sendNotificationToAGroup(body, notificationKeyName, title) {
	const { notification_key: notificationKey } = await getNotificationKey(notificationKeyName);
	const data = {
		priority: 'HIGH',
		notification: { title, body },
		to: [notificationKey]
	};
	const response = await axios.post('https://fcm.googleapis.com/fcm/send', data, config);
	return response.data;
}

exports = module.exports = {
	addRegestrationIdToGroup,
	createNotificationGroup,
	getNotificationKey,
	removeRegestrationIdFromGroup
};
