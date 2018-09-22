const mongoose = require('mongoose');
const tuition = require('../models/tuition');
const school = require('../models/school');
const event = require('../models/event');
const user = require('../models/user');
const Transaction = require('mongoose-transactions');
const transaction = new Transaction();

const categoryToModel = {
	tuition: { name: 'tuition', model: tuition },
	school: { name: 'school', model: school },
	event: { name: 'event', model: event }
};

// Todo: Optimisation needed
/**
 * Update user claims and listing claimedBy
 * @param {ObjectId} userID Id of the user who is claiming the listing
 * @param {object} listingInfo Object containing listingId and listingCategory
 * @returns {Promise} Resolves or rejects based on status
 */
async function claimListing(userID, listingInfo = {}) {
	try {
		if (userID === undefined) throw new Error('User ID not provided');

		const { listingId, listingCategory } = listingInfo.listingId;

		if (listingId === undefined || listingCategory === undefined) throw new Error('Listing Info not provided');

		transaction.update('user', userID, { $push: { claims: { listingCategory, listingId } } });

		const listingModelName = categoryToModel[listingCategory].name;
		const listingModel = categoryToModel[listingCategory].model;

		const listing = await listingModel.findById(listingId);
		if (listing.claimedBy !== undefined) throw new Error('Listing already claimed')

		transaction.update(listingModelName, listingId, { claimedBy: userID });

		return transaction.run();
	} catch (err) {
		console.error(err);
		await transaction.rollback().catch(err1 => console.error(err1));
		transaction.clean();
		return new Promise((resolve, reject) => reject(new Error(err)))
	}
}

// Todo: Optimisation needed
/**
 * Update user claims and listing claimedBy
 * @param {ObjectId} userID Id of the user who is claiming the listing
 * @param {object} listingInfo Object containing listingId and listingCategory
 * @returns {Promise} Resolves or rejects based on status
 */
async function unclaimListing(userID, listingInfo = {}) {
	try {
		if (userID === undefined) throw new Error('User ID not provided');

		const { listingId, listingCategory } = listingInfo.listingId;
		if (listingId === undefined || listingCategory === undefined) throw new Error('Listing Info not provided');

		let isValidRequest = false;
		const userInfo = await user.findById(userID).select(claims);
		if (userInfo.claims) {
			userInfo.claims.forEach(claimedListing => {
				if (claimedListing.listingCategory === listingCategory && claimedListing.listingId === listingId) {
					isValidRequest = true;
				}
			})
		}
		if (isValidRequest === false) throw new Error('Bad request');

		transaction.update('user', userID, { $pull: { claims: { listingCategory, listingId } } });

		const listingModelName = categoryToModel[listingCategory].name;
		transaction.update(listingModelName, listingId, { $unset: { claimedBy: '' } });

		return 'done';
	} catch (err) {
		console.error(err);
		await transaction.rollback().catch(err1 => console.error(err1));
		transaction.clean();
		return new Promise((resolve, reject) => reject(new Error(err)))
	}
}

exports = module.exports = {
	claimListing,
	unclaimListing
};
