const mongoose = require("mongoose");
const arrayUniquePlugin = require("mongoose-unique-array");
const Schema = mongoose.Schema;
const secondarySchemas = require("../secondary-schemas");
const { ReviewsOwnedSchema } = secondarySchemas;
const { ClaimSchema } = secondarySchemas;

const UserSchema = new Schema({
	about: String,
	facebookId: String,
	googleId: String,
	password: {
		type: String,
		select: false
	},
	claims: [ClaimSchema],
	reviewsOwned: [ReviewsOwnedSchema],
	schoolsOwned: [String],
	primaryRole: String, // Institute, student, parent
	isFemale: Boolean,
	addressLine1: String,
	addressLine2: String,
	city: String,
	district: String,
	state: String,
	country: String,
	pin: Number,
	firstName: String,
	middleName: String,
	lastName: String,
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
	bookmarkTuitions: [
		{
			type: String,
			unique: true
		}
	],
	bookmarkSchools: [
		{
			type: String,
			unique: true
		}
	],
	bookmarkEvents: [
		{
			type: String,
			unique: true
		}
	],
	bookmarkBlogs: [
		{
			type: String,
			unique: true
		}
	]
});

UserSchema.plugin(arrayUniquePlugin);

const User = mongoose.model("user", UserSchema);

module.exports = User;
