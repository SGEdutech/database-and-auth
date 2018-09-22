const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;
const secondarySchemas = require('../secondary-schemas');
const { ClaimSchema } = secondarySchemas;
const {
	isMaxStrLength,
	isValidPhoneNumber,
	isValidPin,
	isValidEmail,
	isValidDOB
} = require('../validation-scripts/validations');
const { required, select } = require('../../config.json').MONGO;

const UserSchema = new Schema({
	firstName: { type: String, required, lowercase: true },
	middleName: String,
	lastName: { type: String, lowercase: true },
	gender: { type: String, enum: ['male', 'female', 'other'], select },
	about: String,
	password: { type: String, select },
	facebookId: { type: String, select },
	googleId: { type: String, select },
	claims: [ClaimSchema],
	primaryRole: { type: String, required, enum: ['enterprise', 'student', 'parent'] },
	addressLine1: String,
	addressLine2: String,
	city: { type: String, required },
	district: String,
	state: String,
	country: { type: String, default: 'india' },
	pin: { type: Number, select },
	primaryEmail: { type: String, lowercase: true, required },
	secondaryEmail: { type: String, lowercase: true, select },
	phone: { type: Number, select },
	img_userProfilePic: String,
	dateOfBirth: { type: Date, select },
	goingEvents: [String],
	mayBeGoingEvents: [String],
	schoolStuding: String,
	fbLink: String,
	twitterLink: String,
	youtubeLink: String,
	instaLink: String,
	linkedinLink: String,
	bookmarkTuitions: [{ type: String, unique: true }],
	bookmarkSchools: [{ type: String, unique: true }],
	bookmarkEvents: [{ type: String, unique: true }],
	bookmarkBlogs: [{ type: String, unique: true }]
});

UserSchema.plugin(arrayUniquePlugin);

// UserSchema.post('validate', validateUser);

UserSchema.pre('findOneAndUpdate', function(next) {
	this.options.runValidators = true;
	next();
});

UserSchema.path('phone').validate(isValidPhoneNumber, 'Please enter a valid 10 digit number');

UserSchema.path('about').validate(discription => isMaxStrLength(discription, 200),
	'About cannot be longer than 200 caracters');

UserSchema.path('pin').validate(isValidPin, 'Not a valid pin');

UserSchema.path('primaryEmail').validate(isValidEmail, 'Not a valid email');

// Todo: Test this
UserSchema.path('dateOfBirth').validate(isValidDOB, 'Not a valid email');

UserSchema.path('schoolStuding').validate(schoolName => isMaxStrLength(schoolName, 50),
	'School name must be less than 50 characters');

const User = mongoose.model('user', UserSchema);

module.exports = User;
