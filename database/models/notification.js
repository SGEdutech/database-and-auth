const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { required, select } = require('../../config.json').MONGO;

const RecieverSchema = new Schema({
	userEmail: { type: String, required },
	readAt: Date
});

const NotificationSchema = new Schema({
	senderId: { type: mongoose.Schema.Types.ObjectId, required },
	receivers: [RecieverSchema],
	message: { type: String, required }
}, { timestamps: true });

const Notification = mongoose.model('notification', NotificationSchema);

module.exports = Notification;
