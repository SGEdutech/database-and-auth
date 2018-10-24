const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const secondarySchemas = require('../secondary-schemas');
const GallerySchema = secondarySchemas.GallerySchema;
const ViewsOrHitsSchema = require('../views-or-hits-schema');

const EventSchema = new Schema({
	name: String,
	category: String,
	description: String,
	fromAge: Number,
	toAge: Number,
	organiserName: String,
	organiserPhone: String,
	organiserEmail: String,
	lastDateRegistration: Date,
	website: String,
	fromDate: Date,
	toDate: Date,
	fromTime: String,
	toTime: String,
	addressLine1: String,
	addressLine2: String,
	city: String,
	district: String,
	state: String,
	country: String,
	pin: Number,
	gallery: [GallerySchema],
	img_eventCoverPic: String,
	going: { Number, default: 0 },
	notGoing: { Number, default: 0 },
	mayBeGoing: { Number, default: 0 },
	views: ViewsOrHitsSchema,
	hits: ViewsOrHitsSchema,
	goingUsers: [String],
	bookmarks: Number,
	entryFee: Number,
	signedBy: String,
	claimedBy: String,
	updatedOn: { type: Date, default: Date.now }
});

const Event = mongoose.model('event', EventSchema);

module.exports = Event;
