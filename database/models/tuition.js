const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const secondarySchemas = require('../secondary-schemas');
const ReviewSchema = secondarySchemas.ReviewSchema;
const TeamSchema = secondarySchemas.TeamSchema;
const FacilitiesAndBraggingSchema = secondarySchemas.FacilitiesAndBraggingSchema;
const TimeAndDateSchema = secondarySchemas.TimeAndDateSchema;
const ViewsOrHitsSchema = require('../views-or-hits-schema');
const CourseSchema = require('./course-and-batch');
const StudentSchema = require('../schemas/student');

const {
	isMaxStrLength,
	isValidPhoneNumber,
	isValidPin,
	isValidEmail,
	isValidWebsite
} = require('../validation-scripts/validations');

const { required, select } = require('../../config.json').MONGO;

const TuitionSchema = new Schema({
	name: { type: String, required },
	category: { type: String, required },
	fromAge: { type: Number, min: [0, 'Age can\'t be negative'], max: [100, 'Too old to attend tuition'] },
	toAge: { type: Number, min: [0, 'Age can\'t be negative'], max: [100, 'Too old to attend tuition'] },
	addressLine1: String,
	addressLine2: String,
	city: { type: String, required },
	district: String,
	state: String,
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
	facilities: String,
	img_tuitionCoverPic: String,
	students: [StudentSchema],
	gallery: [String],
	bragging: [FacilitiesAndBraggingSchema],
	reviews: [ReviewSchema],
	courses: [CourseSchema],
	views: ViewsOrHitsSchema,
	hits: ViewsOrHitsSchema,
	bookmarks: Number,
	signedBy: String,
	claimedBy: String,
	updatedOn: { type: Date, default: Date.now() }
});

TuitionSchema.path('name').validate(name => isMaxStrLength(name, 15),
	'Name cannot be more than 15 charecters');

TuitionSchema.path('category').validate(categoryName => isMaxStrLength(categoryName, 10),
	'Category name cannot be more than 10 charecters');

TuitionSchema.path('description').validate(description => isMaxStrLength(description, 200),
	'Description cannot be more than 200 charecters');

TuitionSchema.path('contactPerson').validate(contactPersonName => isMaxStrLength(contactPersonName, 15),
	'Contact person name cannot be more than 15 charecters');

TuitionSchema.path('primaryNumber').validate(isValidPhoneNumber, 'Phone number not valid');

TuitionSchema.path('secondaryNumber').validate(isValidPhoneNumber, 'Phone number not valid');

TuitionSchema.path('pin').validate(isValidPin, 'Pin number not valid');

TuitionSchema.path('email').validate(isValidEmail, 'Email ID not valid');

TuitionSchema.path('website').validate(isValidWebsite, 'Website link not valid');

const Tuition = mongoose.model('tuition', TuitionSchema);

module.exports = Tuition;
