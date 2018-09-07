const route = require('express')
	.Router();
const passport = require('passport');
const FacebookStrategy = require('passport-facebook');
const config = require('./_config')
	.ids;
const User = require('../database/modles/user');
const DatabaseAPIClass = require('../database/api-functions');
const APIHelperFunctions = new DatabaseAPIClass(User);


passport.serializeUser((userid, done) => {
	done(null, userid)
});

passport.deserializeUser((userid, done) => {
	//reimplement it using FindById function of mongoose
	APIHelperFunctions.getSpecificData('_id', userid)
		.then(user => {
			if (!user) {
				done(new Error('no such user'))
			}
			done(null, user)
		})
		.catch(err => done(err))
});

passport.use(new FacebookStrategy({
		clientID: config.facebook.clientID,
		clientSecret: config.facebook.clientSecret,
		callbackURL: config.facebook.callbackURL
	},
	(accessToken, refreshToken, profile, done) => {
		// passport callback function
		const profileInfo = {};
		profileInfo.facebookId = profile.id;
		profileInfo.firstName = profile.displayName.split(' ')[0];
		profileInfo.img_userProfilePic = profile.photos ? profile.photos[0].value : '';
		if (profile.emails !== undefined) {
			profileInfo.primaryEmail = profile.emails[0].value;
		}
		// profileInfo.about = profile._json.tagline;
		APIHelperFunctions.getSpecificData('facebookId', profileInfo.facebookId)
			.then((currentUser) => {
				if (currentUser) {
					// means we already have a account linked with google
					// console.log('user already linked with facebook');

					//send it to serialize phase
					done(null, currentUser._id);
				} else {
					// means we will now save this account
					// console.log("creating new record");
					//we haven't saved phoneNumber and password yet
					APIHelperFunctions.addCollection(profileInfo)
						.then((newUser) => {
							//send it to serialize phase
							done(null, newUser._id);
						});
				}
			});
	}
));

route.get('/', passport.authenticate('facebook'));

route.get('/redirect', passport.authenticate('facebook', { scope: config.facebook.scope }), (req, res) => {
	res.redirect(req.session.returnTo || '/');
	delete req.session.returnTo;
});

exports = module.exports = {
	route
};
