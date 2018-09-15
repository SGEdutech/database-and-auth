const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const secondarySchemas = require('../secondary-schemas');
const ReviewSchema = secondarySchemas.ReviewSchema;
const TeamSchema = secondarySchemas.TeamSchema;
const FacilitiesAndBraggingSchema = secondarySchemas.FacilitiesAndBraggingSchema;
const TimeAndDateSchema = secondarySchemas.TimeAndDateSchema;
const ViewsOrHitsSchema = require('../views-or-hits-schema');

const TuitionSchema = new Schema({
	name: String,
	category: String,
	fromAge: Number,
	toAge: Number,
	addressLine1: String,
	addressLine2: String,
	city: String,
	district: String,
	state: String,
	country: String,
	pin: Number,
	dayAndTimeOfOperation: [TimeAndDateSchema],
	team: [TeamSchema],
	description: String,
	contactPerson: String,
	primaryNumber: Number,
	secondaryNumber: Number,
	email: { type: String, lowercase: true },
	website: String,
	fbLink: String,
	twitterLink: String,
	youtubeLink: String,
	instaLink: String,
	facilities: String, // image name discription array  // drop down
	img_tuitionCoverPic: String,
	gallery: [String],
	bragging: [FacilitiesAndBraggingSchema],
	courses: [{ type: Schema.Types.ObjectId, ref: 'course' }],
	reviews: [ReviewSchema],
	views: ViewsOrHitsSchema,
	hits: ViewsOrHitsSchema,
	bookmarks: Number,
	signedBy: String,
	claimedBy: String,
	updatedOn: { type: Date, default: Date.now() }
});

const Tuition = mongoose.model('tuition', TuitionSchema);

module.exports = Tuition;
