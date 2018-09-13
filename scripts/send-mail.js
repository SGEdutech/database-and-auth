const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: 'contact@thebrainlab.in',
        clientId: '295562793969-ehhfh9eth0l2i2vv8h7osv0bkcn9lebq.apps.googleusercontent.com',
        clientSecret: 'wSucnZWJbmLtOxDHv0UHPlMS',
        refreshToken: '1/DOXrpt9eHK9CrO9cDKDp1RygaE2v9LW4Hch3iH396D9mxDAVbn4luhEAB_yNH2EK',
        accessToken: 'ya29.GlsCBoUOU4fWKcEPuKo0AjkJAAjSy2lE3mFNH0GJXgEBMgcF6co8cZwfo2Cj5QCkeJpdPTww2WkJm5HK_P-uMI0PGoCtihCDyVVZ0LXaIBCOT_bqqUK6GAouRD01',
        expires: 1484314697598
    }
});

function sendMail(recipients, subject, message) {
    // recipients can be string or array
    // message in parsed from HTML
    const mailOptions = {
        from: 'contact@thebrainlab.in',
        to: recipients,
        subject: subject,
        html: message
    };
    transporter.sendMail(mailOptions).then(data => console.log(data)).catch(err => console.error(err));
}

module.exports = sendMail;