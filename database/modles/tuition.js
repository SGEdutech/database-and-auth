const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;

const secondarySchemas = require('../secondary-schemas');
const ReviewSchema = secondarySchemas.ReviewSchema;
const CourseSchema = secondarySchemas.CourseSchema;
const TeamSchema = secondarySchemas.TeamSchema;
const FacilitiesAndBraggingSchema = secondarySchemas.FacilitiesAndBraggingSchema;
const TimeAndDateSchema = secondarySchemas.TimeAndDateSchema;

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
	courses: [CourseSchema],
	reviews: [ReviewSchema],
	views: { type: Number, default: 0 },
	hits: { type: Number, default: 0 },
	bookmarks: Number,
	signedBy: String,
	claimedBy: String,
	updatedOn: { type: Date, default: Date.now() }
});

TuitionSchema.plugin(arrayUniquePlugin);

const Tuition = mongoose.model('tuition', TuitionSchema);

module.exports = Tuition;
