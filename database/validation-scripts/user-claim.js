const mongoose = require('mongoose');
const tuition = require('../models/tuition');
const school = require('../models/school');
const event = require('../models/event');
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
	if (userID === undefined) throw new Error('User ID not provided');

	const listingId = listingInfo.listingId;
	const listingCategory = listingInfo.listingCategory;

	if (listingId === undefined || listingCategory === undefined) throw new Error('Listing Info not provided');

	try {
		transaction.update('user', userID, { $push: { claims: { listingCategory, listingId } } });

		const listingModelName = categoryToModel[listingCategory].name;
		const listingModel = categoryToModel[listingCategory].model;

		listingModel.findById(listingId).then(listing => {
			if (listing.claimedBy !== undefined) throw new Error('Listing already claimed')
		})
		transaction.update(listingModelName, listingId, { claimedBy: userID });

		return transaction.run();
	} catch (err) {
		console.error(err);
		await transaction.rollback().catch(err1 => console.error(err1));
		transaction.clean();
		return new Promise((resolve, reject) => reject(new Error(err)))
	}
}

exports = module.exports = {
	claimListing
};
