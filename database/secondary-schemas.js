const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
	name: String,
	phone: Number,
	email: String
});

const ReviewsOwnedSchema = new Schema({
	category: String,
	outerId: {
		type: String,
		unique: true
	},
	innerId: String
});

const ImportantDateSchema = new Schema({
	title: String,
	date: Date
});

const ReviewSchema = new Schema({
	likes: {
		type: Number,
		default: 0
	},
	rating: {
		type: Number,
		required: true
	},
	owner: {
		type: String,
		unique: true,
		sparse: true
	},
	description: String
});

const GallerySchema = new Schema({
	img_path: String,
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
	listingCategory: {
		type: String,
		enum: ['tuition', 'school', 'event']
	},
    listingId: String
});

exports = module.exports = {
	ContactSchema,
	ReviewsOwnedSchema,
	ImportantDateSchema,
	ReviewSchema,
	GallerySchema,
	FacilitiesAndBraggingSchema,
	TeamSchema,
	TimeAndDateSchema,
	ClaimSchema
};