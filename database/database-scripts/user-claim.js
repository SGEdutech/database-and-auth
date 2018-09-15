const mongoose = require('mongoose');
const Transaction = require('mongoose-transactions'),
    transaction = new Transaction();

const categoryToModel = {
    tuition: 'tuition',
    school: 'school',
    event: 'event'
};

async function claimListing(userID, listingInfo = {}) {
    if (userID === undefined) throw new Error('User ID not provided');

    const listingId = listingInfo.listingId;
    const listingCategory = listingInfo.listingCategory;

    if (listingId === undefined || listingCategory === undefined) throw new Error('Listing Info not provided');

    try {
        transaction.update('user', userID, {
            $push: {
                claims: {
                    listingCategory: listingCategory,
                    listingId: listingId
                }
            }
        });

        const listingModel = categoryToModel[listingCategory];
        transaction.update(listingModel, listingId, { claimedBy: userID });

        return transaction.run();
    } catch (err) {
        console.error(err);
        await transaction.rollback().catch(err => console.error(err));
        transaction.clean();
        return new Promise((resolve, reject) => reject(new Error(err)))
    }
}

exports = module.exports = {
    claimListing
};
