const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Tuition = require('./tuition');
const School = require('./school');

const CourseSchema = new Schema({
	name: { type: String, required: true },
	fees: { type: Number, required: true },
	description: String,
	isActive: { type: Boolean, default: true },
	listingCategory: { type: String, required: true },
	listingId: { type: Schema.Types.ObjectId, required: true },
	batches: [{ type: Schema.Types.ObjectId, ref: 'batch' }]
});

CourseSchema.post('validate', doc => {
	if (doc.listingCategory === 'tuition') {
		return new Promise((resolve, reject) => {
			Tuition.find({
				_id: doc.listingId
			}).then(tuition => {
				if (tuition === null) {
					reject(new Error('Listing ID or category is incorrect'));
					return;
				}
				resolve();
			}).catch(err => reject(err));
		})
	} else if (doc.listingCategory === 'school') {
		return new Promise((resolve, reject) => {
			School.find({
				_id: doc.listingId
			}).then(tuition => {
				if (tuition === null) {
					reject(new Error('Listing ID or category is incorrect'));
					return;
				}
				resolve();
			}).catch(err => reject(err));
		})
	}
	return new Promise((resolve, reject) => reject(new Error('Please provide a valid category')));
});

CourseSchema.post('save', courseAdded => {
	return new Promise((resolve, reject) => {
		if (courseAdded.listingCategory === 'tuition') {
			Tuition.findOne({
				_id: courseAdded.listingId
			}).then(tuition => {
				tuition.courses.push(courseAdded._id);
				return tuition.save();
			}).then(() => resolve()).catch(err => reject());
		} else if (courseAdded.listingCategory === 'school') {
			School.findOne({ _id: courseAdded.listingId }).then(school => {
				school.courses.push(courseAdded._id);
				return school.save();
			}).then(() => resolve()).catch(err => reject());
		}
	})
});

const Course = mongoose.model('course', CourseSchema);

module.exports = Course;
