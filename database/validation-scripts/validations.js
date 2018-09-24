const School = require('../models/school');
const Tuition = require('../models/tuition');

/**
 * Returns if a user has provided any ID
 * @param {object} user User object to be posted
 * @returns {boolean} If user object has any ID
 */
function isIdProvided(user) {
	return Boolean(user.password || user.googleId || user.facebookId);
}

/**
 * Evaluates whether given string is longer than maximum length
 * @param {string} str String to test length of
 * @param {number} maxLength Maximum length of string
 * @returns {boolean} True if the string is smaller than or equals to the maximum
 * length else false
 */
function isMaxStrLength(str, maxLength) {
	return maxLength >= str.length;
}

/**
 * Validates if the provided pin is a valid indian pin
 * @param {number} pin Pin that is intended to validate
 * @returns {boolean} True if pin is valid indian pin else false
 */
function isValidPin(pin) {
	const indianPinRegex = new RegExp('^[1-9][0-9]{5}$');
	return indianPinRegex.test(pin);
}

/**
 * Checks if number has length of 10 digits
 * @param {number} phoneNumber Phone number to validate
 * @returns {boolean} If phone number has 10 digits
 */
function isValidPhoneNumber(phoneNumber) {
	const phoneNumberRegex = new RegExp('^[0-9]{10}$');
	return phoneNumberRegex.test(phoneNumber);
}

/**
 * Checks if the string is a possible email address
 * @param {string} email Email to validate
 * @returns {boolean} True if the string is a possible email address else false
 */
function isValidEmail(email) {
	// Backslashes have been escaped in this regex for javascript
	const emailRegex = new RegExp(`^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|
	(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+
	[a-zA-Z]{2,}))$`);
	return emailRegex.test(email);
}

/**
 * Checks wether date provided is not a future date
 * @param {date} dateOfBirth Date of birth to validate against
 * @returns {boolean} True if the date provided is in the past else false
 */
function isValidDOB(dateOfBirth) {
	return Date.now() >= dateOfBirth.getTime();
}

/**
 * Tests if url provided is possible weisite url
 * @param {string} url Url of website
 * @returns {boolean} True if url is a possible website else false
 */
function isValidWebsite(url) {
	const websiteRegex = new RegExp('^((https?|ftp|smtp):\\/\\/)?(www.)?[a-z0-9]+\\.[a-z]+(\\/[a-zA-Z0-9#]+\\/?)*$');
	return websiteRegex.test(url);
}

/**
 * Mongoose middleware that check if user to be posted is valid
 * @param {object} user User object to be posted
 * @param {function} next Callback
 * @returns {void}
 */
function validateUser(user, next) {
	if (isIdProvided(user) === false) {
		next(new Error('No google ID, facebook ID or local password provided'));
		return;
	}
	if (isValidPhoneNumber(user.phone) === false) {
		next(new Error('Phone number not valid'))
		return;
	}
	next();
}

exports = module.exports = {
	validateUser,
	isIdProvided,
	isValidPhoneNumber,
	isMaxStrLength,
	isValidPin,
	isValidEmail,
	isValidDOB,
	isValidWebsite
};
