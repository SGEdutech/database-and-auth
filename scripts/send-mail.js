const nodemailer = require('nodemailer');
const { clientId, clientSecret, refreshToken, accessToken } = require('../mail-config.json');

const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
		type: 'OAuth2',
		user: 'contact@eduatlas.com',
		clientId,
		clientSecret,
		refreshToken,
		accessToken,
		expires: 1484314697598
	}
});

// Recipients can be string or array
// Message in parsed from HTML
// Attachments must have key content and can have keys filename, contentType
function sendMail(recipients, subject, message, attachment) {
	if (recipients === undefined) throw new Error('Recipient must be provided');
	if (typeof recipients !== 'string' && Array.isArray(recipients) === false) throw new Error('Recipients must be an object or an array'); 
	if (attachment !== undefined) {
		if (typeof attachment !== 'object') throw new Error('Attachment must be an object');
		if (attachment.content === undefined) throw new Error('Attachment must have content');
	}
	subject = subject || '';
	message = message || '';

	const mailOptions = {
		from: 'EDUATLAS <contact@eduatlas.com>',
		to: recipients,
		subject,
		html: message
	};
	if (attachment) mailOptions.attachments = [attachment];
	transporter.sendMail(mailOptions).then(data => console.log(data)).catch(err => console.error(err));
}

module.exports = sendMail;
