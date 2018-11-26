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

function sendMail(recipients, subject, message) {
	// recipients can be string or array
	// message in parsed from HTML
	const mailOptions = {
		from: 'EDUATLAS <contact@eduatlas.com>',
		to: recipients,
		subject,
		html: message
	};
	transporter.sendMail(mailOptions).then(data => console.log(data)).catch(err => console.error(err));
}

module.exports = sendMail;
