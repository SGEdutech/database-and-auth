const Schema = require('mongoose').Schema;
const { required, select } = require('../../config.json').MONGO;

const LeadsComments = new Schema({
	message: { type: String, required },
	createdAt: { type: Date, default: Date.now }
});

const LeadsSchema = new Schema({
	name: { type: String, required },
	email: String,
	phone: { type: Number, required },
	message: String,
	comments: [LeadsComments],
	// FIXME: Enum not working
	status: { type: String, enum: ['active', 'closed', 'enrolled'], default: 'active' },
	nextFollowUp: Date,
	courseId: Schema.Types.ObjectId,
	leadStrength: { type: String, enum: ['hot', 'cold', 'warm'] },
	source: { type: String, enum: ['eduatlas.com', 'school campaign', 'pamphlets', 'facebook', 'walkin', 'sulekha', 'justdial', 'urbanpro', 'siksha', 'google maps', 'other'] },
	createdAt: { type: Date, default: Date.now }
});

module.exports = LeadsSchema;
