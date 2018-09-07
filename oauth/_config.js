const ids = {
	facebook: {
		clientID: '295919860935591',
		clientSecret: '7d342a0a9ff60b4f95769b74af58d687',
		callbackURL: '/auth/facebook/redirect',
		scope: ['email']
	},
	google: {
		clientID: '630427763568-koh8sqs7f05dqirfhbj34kiukulu8gft.apps.googleusercontent.com',
		clientSecret: 'iny-CHdpeHy6GrzZAQCRmi4F',
		callbackURL: '/auth/google/redirect',
		scope: ['profile', 'phone', 'email']

	}
};

const keys = {
	CookieKey: 'somesecretstring'
};

exports = module.exports = {
	ids,
	keys
};
