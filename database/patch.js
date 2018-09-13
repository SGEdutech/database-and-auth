const mongoose = require('mongoose');
const uri = require('../config')
	.MONGO.URI;
const Tuition = require('./modles/tuition');
const School = require('./modles/tuition');
const Event = require('./modles/tuition');
const User = require('./modles/user');


mongoose.connect(uri, {
		useNewUrlParser: true
	})
	.then(changeLog)
	.catch(err => console.error(err));

const promiseArr = [];

function changeLog() {
	User.find({})
		.then(users => {
			users.forEach(user => {
				user.schoolsOwned = undefined;
				promiseArr.push(user.save());
			})
		})
		.catch(err => console.error(err));
}

Promise.all(promiseArr)
	.then(() => console.log('Done nigga!'))
	.catch(err => console.error(err));