const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;
const secondarySchemas = require('../secondary-schemas');
const {
	ReviewsOwnedSchema
} = secondarySchemas;
const {
	ClaimSchema
} = secondarySchemas;

const UserSchema = new Schema({
	firstName: String,
	middleName: String,
	lastName: String,
	gender: { type: String, enum: ['male', 'female', 'other'] },
	about: String,
	password: {
		type: String,
		select: false
	},
	facebookId: {
		type: String,
		select: false
	},
	googleId: {
		type: String,
		select: false
	},
	claims: [ClaimSchema],
	reviewsOwned: [ReviewsOwnedSchema],
	primaryRole: String, // Institute, student, parent
	addressLine1: String,
	addressLine2: String,
	city: String,
	district: String,
	state: String,
	country: String,
	pin: Number,
	primaryEmail: {
		type: String,
		lowercase: true,
		unique: true
	},
	secondaryEmail: {
		type: String,
		lowercase: true
	},
	phone: Number,
	img_userProfilePic: String,
	dateOfBirth: Date,
	goingEvents: [String],
	mayBeGoingEvents: [String],
	schoolStuding: String,
	fbLink: String,
	twitterLink: String,
	youtubeLink: String,
	instaLink: String,
	linkedinLink: String,
	bookmarkTuitions: [{
		type: String,
		unique: true
	}],
	bookmarkSchools: [{
		type: String,
		unique: true
	}],
	bookmarkEvents: [{
		type: String,
		unique: true
	}],
	bookmarkBlogs: [{
		type: String,
		unique: true
	}]
});

// CourseSchema.post('validate', docs => {
// 	return new Promise((resolve, reject) => {
//
// 	})
// });

const User = mongoose.model('user', UserSchema);

module.exports = User;
