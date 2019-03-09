const route = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('../database/models/user');
const DatabaseAPIClass = require('../database/api-functions');
const APIHelperFunctions = new DatabaseAPIClass(User);
const {
	getNotificationKey,
	removeRegestrationIdFromGroup,
	shoveRegistrationIdInAGroup
} = require('../scripts/firebase');

passport.serializeUser((userid, done) => {
	//userid will be stuffed in cookie
	done(null, userid);
});

passport.deserializeUser((userid, done) => {
	//reimplement it using FindById function of mongoose
	APIHelperFunctions.getSpecificData({ '_id': userid })
		.then(user => {
			if (!user) {
				done(new Error('no such user'));
			}
			done(null, user);
		}).catch(err => done(err));
});

passport.use(new LocalStrategy((username, password, done) => {
	APIHelperFunctions.getSpecificData({ 'primaryEmail': username }, { returnPassword: true })
		.then(user => {
			if (!user) {
				done('No such user');
			} else {
				if (user.password !== password) {
					done('Wrong password');
				} else {
					console.log('successful local login');
				}
			}
			//below line will pass user to serialize user phase
			done(null, user._id);
		})
		.catch(err => {
			done(err);
		});
}));

route.post('/login', passport.authenticate('local'), async (req, res) => {
	try {
		APIHelperFunctions.getSpecificData({ _id: req.user }).then(user => res.send(user)).catch(err => console.error(err));
		const { registrationDetails } = req.body;
		if (registrationDetails) {
			const { registrationToken, tuitionId } = registrationDetails;
			const notificationKeyName = tuitionId + '-' + req.body.username;
			shoveRegistrationIdInAGroup(notificationKeyName, registrationToken);
		}
	} catch (error) {
		console.error(error.response.data);
	}
});

route.use('/logout', async (req, res) => {
	req.session.destroy(() => res.send({ done: true }));
	const { registrationDetails } = req.body;
	if (registrationDetails) {
		const { registrationToken, tuitionId } = registrationDetails;
		const notificationKeyName = tuitionId + '-' + req.body.email;
		try {
			const { notification_key: notificationKey } = await getNotificationKey(notificationKeyName);
			removeRegestrationIdFromGroup(notificationKey, notificationKeyName, registrationToken);
		} catch (error) {
			console.error(error);
		}
	}
});

// post request to sign-up don't need passportJS
route.post('/signup', (req, res) => {
	// TODO: Write better code
	APIHelperFunctions.getSpecificData({ primaryEmail: req.body.primaryEmail }) // regex to check if _id is valid mongo id- /^[0-9a-fA-F]{24}$/
		.then(currentUser => {
			if (currentUser) {
				res.status(400).send('Email already linked with a account');
			} else {
				APIHelperFunctions.addCollection(req.body)
					.then(data => res.end()).catch(err => console.error(err));
			}
		}).catch(err => console.error(err));
});

exports = module.exports = { route };
