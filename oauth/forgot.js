const route = require('express').Router();
const cache = require('memory-cache');
const uid = require('uid');
const sendMail = require('../scripts/send-mail');
const User = require('../database/modles/user');
const DbAPIClass = require('../database/api-functions');
const userDbFunctions = new DbAPIClass(User);

route.post('/request-email', (req, res) => {
    userDbFunctions.getSpecificData({primaryEmail: req.body.email})
        .then(user => {
            if (user === null) {
                res.send({done: false, message: 'We don\'t know this email'});
                return;
            }
            const token = generateAndCacheToken(req.body.email);
            sendMail(req.body.email, 'Password Reset', getEmailContent(token));
            res.send({done: true});
        })
        .catch(err => console.error(err));
});

route.get('/request-password-reset/:token', (req, res) => {
    const email = cache.get(req.params.token);
    if (email === null) {
        res.send('Your password has either expired or never been requested');
    }
    res.redirect(`/resetpassword.html?${req.params.token}`);
});

route.post('/change-password', (req, res) => {
    const email = cache.get(req.body.token);
    if (email === null) {
        res.send({
            done: false,
            message: 'Seems like token has been expired. Please try again'
        });
    }
    userDbFunctions.updateOneRow({primaryEmail: email}, {password: req.body.password})
        .then(() => {
            res.send({done: true});
            cache.del(req.body.token);
        })
        .catch(() => res.send({done: false}));
});

function generateAndCacheToken(userId) {
    const token = uid(10);
    cache.put(token, userId, 3600000);
    return token;
}

function getEmailContent(token) {
    return `
        <p>You are recieving this because you (or someone else) have requested the reset of the password of your account</p>
        <p>Please click on the following link or paste it into your browser to complete the process</p>
        <a href="http://localhost:6868/forgot/request-password-reset/${token}">http://localhost:6868/forgot/request-password-reset/${token}</a>
        <p>If you did not request this, please ignore this email and your password will remail unchanged</p>
    `;
}

module.exports = route;