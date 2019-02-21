const route = require('express').Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const config = require('./_config').ids;
const User = require('../database/models/user');
const DatabaseAPIClass = require('../database/api-functions');
const APIHelperFunctions = new DatabaseAPIClass(User);


passport.serializeUser(function (userid, done) {
	//userid will be stuffed in cookie
	done(null, userid);
});

passport.deserializeUser(function (userid, done) {
	//reimplement it using FindById function of mongoose
	APIHelperFunctions.getSpecificData('_id', userid).then(user => {
		if (!user) {
			return done(new Error("no such user"))
		} else {
			console.log("user logged in with google id")
		}
		//todo - hide password from req.user
		done(null, user);
	})
		.catch(err => done(err));
});

passport.use(new GoogleStrategy({
	clientID: config.google.clientID,
	clientSecret: config.google.clientSecret,
	//below is the path where google consent screen will redirect user to
	//same redirect address must be saved in console.developer.google in order to work
	callbackURL: config.google.callbackURL
}, (accessToken, refreshToken, profile, done) => {
	// passport callback function
	//passport returns here with user info
	const profileInfo = {};
	profileInfo.googleId = profile.id;
	profileInfo.firstName = profile.displayName.split(' ')[0];
	profileInfo.img_userProfilePic = profile.photos ? profile.photos[0].value : '';
	if (profile.emails) {
		profileInfo.primaryEmail = profile.emails[0].value;
	}
	profileInfo.about = profile._json.tagline;

	/*console.log("*******");
	console.log(profileInfo);
	console.log("*******");*/

	APIHelperFunctions.getSpecificData({ 'googleId': profileInfo.googleId })
		.then(currentUser => {
			if (currentUser) {
				//below line will pass user to serialize user phase
				done(null, currentUser._id);
			} else {
				APIHelperFunctions.addCollection(profileInfo)
					.then(newUser => {
						//below line will pass user to serialize user phase
						done(null, newUser._id);
					});
			}
		});
}
));

route.get('/', passport.authenticate('google', { scope: config.google.scope }));

//callback route for google to redirect user
//here google will send a code(in uri) which we will use to get user info
route.get('/redirect', passport.authenticate('google'),
	function (req, res) {
		res.redirect(req.session.returnTo || '/');
		delete req.session.returnTo;
	});

exports = module.exports = {
	route
};
