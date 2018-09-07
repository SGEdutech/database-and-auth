const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;
const promotionsSchema = require('../promotions-schema');

const promotedHomeSchema = new Schema(promotionsSchema);

promotedHomeSchema.plugin(arrayUniquePlugin);

const promotedHome = mongoose.model('promotedHome', promotedHomeSchema);

module.exports = promotedHome;
