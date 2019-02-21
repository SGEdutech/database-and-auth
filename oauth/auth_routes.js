const route = require('express')
	.Router();

route.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/login');
});

const routes = {
	google: require('./google')
		.route,
	facebook: require('./facebook')
		.route,
	local: require('./local')
		.route
};

route.use('/google', routes.google);
route.use('/facebook', routes.facebook);
route.use('/local', routes.local);

exports = module.exports = route;
