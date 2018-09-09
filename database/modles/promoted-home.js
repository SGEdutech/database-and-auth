const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;
const promotionsSchema = require('../promotions-schema');

const PromotedHomeSchema = new Schema(promotionsSchema);

PromotedHomeSchema.plugin(arrayUniquePlugin);

const PromotedHome = mongoose.model('promotedHome', PromotedHomeSchema);

module.exports = PromotedHome;
