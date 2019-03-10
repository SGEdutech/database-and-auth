const axios = require('axios');
const { authorizationKey, projectId } = require('../config.json').FIREBASE;

const config = {
	headers: {
		'Content-Type': 'application/json',
		'Authorization': `key=${authorizationKey}`,
		'project_id': projectId
	}
};

async function _addRegestrationIdToGroup(notificationKey, notificationKeyName, registrationToken) {
	const data = {
		operation: 'add',
		notification_key: notificationKey,
		notification_key_name: notificationKeyName,
		registration_ids: [registrationToken]
	};
	const response = await axios.post('https://android.googleapis.com/gcm/notification', data, config);
	return response.data;
}

async function _createNotificationGroup(notificationKeyName, registrationToken) {
	const data = {
		operation: 'create',
		notification_key_name: notificationKeyName,
		registration_ids: [registrationToken]
	};
	const response = await axios.post('https://android.googleapis.com/gcm/notification', data, config);
	return response.data;
}

async function _getNotificationKey(notificationKeyName) {
	try {
		const response = await axios.get(`https://fcm.googleapis.com/fcm/notification?notification_key_name=${notificationKeyName}`, config);
		return response.data;
	} catch (error) {
		if (error.response.data.error === 'notification_key not found') {
			return null;
		}
	}
}

async function removeRegestrationIdFromGroup(notificationKeyName, registrationToken) {
	try {
		const { notification_key: notificationKey } = await _getNotificationKey(notificationKeyName);
		if (Boolean(notificationKey) === false) return;
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
		const { notification_key: notificationKey } = await _getNotificationKey(notificationKeyName);
		if (Boolean(notificationKey) === false) return;
		const data = {
			priority: 'HIGH',
			notification: { title, body },
			to: notificationKey
		};
		const response = await axios.post('https://fcm.googleapis.com/fcm/send', data, config);
		return response.data;
	} catch (error) {
		console.error(error);
	}
}

async function shoveRegistrationIdInAGroup(notificationKeyName, registrationToken) {
	try {
		const { notification_key: notificationKey } = await _getNotificationKey(notificationKeyName);
		if (notificationKey) {
			const response = await _addRegestrationIdToGroup(notificationKey, notificationKeyName, registrationToken);
			return response.data;
		}
		const response = await _createNotificationGroup(notificationKeyName, registrationToken);
		return response.data;
	} catch (error) {
		console.error(error);
	}
}

exports = module.exports = {
	removeRegestrationIdFromGroup,
	sendNotificationToAGroup,
	shoveRegistrationIdInAGroup
};
