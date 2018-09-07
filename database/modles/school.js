const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;

const secondarySchemas = require('../secondary-schemas');
const ReviewSchema = secondarySchemas.ReviewSchema;
const ImportantDateSchema = secondarySchemas.ImportantDateSchema;
const FacilitiesAndBraggingSchema = secondarySchemas.FacilitiesAndBraggingSchema;
const TeamSchema = secondarySchemas.TeamSchema;
const TimeAndDateSchema = secondarySchemas.TimeAndDateSchema;

const SchoolSchema = new Schema({
	coverPic: String,
	gallery: [String],
	bragging: [FacilitiesAndBraggingSchema],
	description: String,
	otherInfo: String,
	curriculum: String,
	grades: String,
	type: String,
	principalName: String,
	yearFounded: Number,
	schoolTiming: [TimeAndDateSchema],
	officeTiming: [TimeAndDateSchema],
	name: String,
	addressLine1: String,
	addressLine2: String,
	city: String,
	district: String,
	state: String,
	country: String,
	pin: Number,
	facilities: String,
	activities: [String],
	team: [TeamSchema],
	reviews: [ReviewSchema],
	fee: String,
	img_schoolCoverPic: String,
	admissionProcess: String,
	eligibilityCriteria: String,
	startTime: Date,
	endTime: Date,
	importantDates: [ImportantDateSchema],
	views: { type: Number, default: 0 },
	hits: { type: Number, default: 0 },
	bookmarks: Number,
	claimedBy: String,
	contactPerson: String,
	primaryNumber: Number,
	secondaryNumber: Number,
	email: String,
	website: String,
	fbLink: String,
	twitterLink: String,
	youtubeLink: String,
	instaLink: String,
	category: String,
	signedBy: String,
	updated: { type: Date, default: Date.now }
});

SchoolSchema.plugin(arrayUniquePlugin);

const School = mongoose.model('school', SchoolSchema);

module.exports = School;
