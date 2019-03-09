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
	try {
		const data = {
			operation: 'add',
			notification_key: notificationKey,
			notification_key_name: notificationKeyName,
			registration_ids: [registrationToken]
		};
		const response = await axios.post('https://android.googleapis.com/gcm/notification', data, config);
		return response.data;
	} catch (error) {
		console.error(error);
	}
}

async function createNotificationGroup(notificationKeyName, registrationToken) {
	try {
		const data = {
			operation: 'create',
			notification_key_name: notificationKeyName,
			registration_ids: [registrationToken]
		};
		const response = await axios.post('https://android.googleapis.com/gcm/notification', data, config);
		return response.data;
	} catch (error) {
		console.error(error);
	}
}

async function getNotificationKey(notificationKeyName) {
	try {
		const response = await axios.get(`https://fcm.googleapis.com/fcm/notification?notification_key_name=${notificationKeyName}`, config);
		return response.data;
	} catch (error) {
		console.error(error);
	}
}

async function removeRegestrationIdFromGroup(notificationKey, notificationKeyName, registrationToken) {
	try {
		const data = {
			operation: 'remove',
			notification_key: notificationKey,
			notification_key_name: notificationKeyName,
			registration_ids: [registrationToken]
		};
		const response = await axios.post('https://android.googleapis.com/gcm/notification', data, config);
		return response.data;
	} catch (error) {
		console.error(error);
	}
}

async function sendNotificationToAGroup(body, notificationKeyName, title) {
	try {
		const { notification_key: notificationKey } = await getNotificationKey(notificationKeyName);
		const data = {
			priority: 'HIGH',
			notification: { title, body },
			to: [notificationKey]
		};
		const response = await axios.post('https://fcm.googleapis.com/fcm/send', data, config);
		return response.data;
	} catch (error) {
		console.error(error);
	}
}

async function shoveRegistrationIdInAGroup(notificationKeyName, registrationToken) {
	try {
		try {
			const { notification_key: notificationKey } = await getNotificationKey(notificationKeyName);
			const response = await addRegestrationIdToGroup(notificationKey, notificationKeyName, registrationToken);
			return response.data;
		} catch (error) {
			if (error.response.data.error === 'notification_key not found') {
				const response = await createNotificationGroup(notificationKeyName, registrationToken);
				return response.data;
			}
		}
	} catch (error) {
		console.error(error);
	}
}

exports = module.exports = {
	getNotificationKey,
	removeRegestrationIdFromGroup,
	sendNotificationToAGroup,
	shoveRegistrationIdInAGroup
};
