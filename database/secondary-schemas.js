const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { required } = require('../config.json').MONGO;

const ContactSchema = new Schema({
	name: String,
	phone: Number,
	email: String
});

const ReviewsOwnedSchema = new Schema({
	category: String,
	outerId: String,
	innerId: String
});

const ImportantDateSchema = new Schema({
	title: String,
	date: Date
});

const ReviewSchema = new Schema({
	likes: { type: Number, default: 0 },
	rating: { type: Number, required },
	owner: Schema.Types.ObjectId,
	description: String,
	createdAt: { type: Date, default: Date.now }
});

const RoleSchema = new Schema({
	type: { type: String, enum: ['teacher'], required },
	email: { type: String, required }
});

const GallerySchema = new Schema({
	imageName: { type: String, required },
	img_path: { type: String, required },
	album: String
});

const FacilitiesAndBraggingSchema = new Schema({
	title: String,
	description: String,
	img_cover: String
});

const TeamSchema = new Schema({
	name: String,
	description: String,
	qualification: String,
	img_path: String
});

const TimeAndDateSchema = new Schema({
	day: String,
	fromTime: String,
	toTime: String
});

const ClaimSchema = new Schema({
	listingCategory: { type: String, enum: ['tuition', 'school', 'event'] },
	listingId: String
});

const CoursesOfferedSchema = new Schema({
	title: String,
	ageGroup: String,
	duration: String,
	fee: Number,
	nextBatch: Date
});

const DiscountSchema = new Schema({
	code: { type: String, lowercase: true, trim: true, required },
	amount: { type: Number, required },
	isPercent: { type: Boolean, default: false }
});

const ResourceSchema = new Schema({
	path: String,
	title: String,
	students: [String],
	description: String,
	type: { type: String, required, enum: ['reference material', 'homework', 'test', 'video'], default: 'reference material' },
	ytUrl: String
});

const RequestSchema = new Schema({
	name: { type: String, required },
	email: { type: String, required },
	phone: { type: String }
	// change phone to required
});

exports = module.exports = {
	ContactSchema,
	ReviewsOwnedSchema,
	ImportantDateSchema,
	ReviewSchema,
	RoleSchema,
	GallerySchema,
	FacilitiesAndBraggingSchema,
	TeamSchema,
	TimeAndDateSchema,
	CoursesOfferedSchema,
	ClaimSchema,
	DiscountSchema,
	ResourceSchema,
	RequestSchema
};
