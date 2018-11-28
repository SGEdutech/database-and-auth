const sendMail = require('./send-mail');

const subject = 'Welcome To Eduatlas';

const content = `
    <p>Hi!</p>
    <p>We are so happy you are here. We founded Eduatlas because we wanted to create a comprehensive and trust worthy platform for you to find everything you to study or teach well.</p>
    <p>We hope you'll find this platform useful and if ever you may have a suggestion to help us improve, we'll be listening! Just drop in a word at contact@eduatlas.com</p>
    <p>Regards,</p>
    <p>Team Eduatlas</p>
`;

function sendWelcomeMail(recipient) {
	sendMail(recipient, subject, content);
}

module.exports = sendWelcomeMail;
