exports = module.exports = {
	hits: [{
		type: Date,
		default: Date.now()
	}],
	views: [{
		type: Date,
		default: Date.now()
	}],
	expires: Date,
	userId: String,
	category: String,
	listingId: String
};