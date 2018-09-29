const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const RecieverSchema = require('../schemas/receiver');
const { required, select } = require('../../config.json').MONGO;

const NotificationSchema = new Schema({
	senderId: { type: mongoose.Schema.Types.ObjectId, required },
	receivers: [RecieverSchema],
	message: { type: String, required }
}, { timestamps: true });

const Notification = mongoose.model('notification', NotificationSchema);

module.exports = Notification;
