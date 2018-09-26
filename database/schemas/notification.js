const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const NotificationSchema = new Schema({
	sender: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
	receivers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
	message: String,
	read_by: [{
		readerId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
		readAt: { type: Date, default: Date.now }
	}],
	created_at: { type: Date, default: Date.now() }
});
