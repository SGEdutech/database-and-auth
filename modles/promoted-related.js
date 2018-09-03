const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;
const promotionsSchema = require('../promotions-schema');

const promotedRelatedSchema = new Schema(promotionsSchema);

promotedRelatedSchema.plugin(arrayUniquePlugin);

const promotedRelated = mongoose.model('promotedRelated', promotedRelated);

module.exports = promotedRelated;
