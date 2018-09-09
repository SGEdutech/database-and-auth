const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;
const promotionsSchema = require('../promotions-schema');

const PromotedRelatedSchema = new Schema(promotionsSchema);

PromotedRelatedSchema.plugin(arrayUniquePlugin);

const PromotedRelated = mongoose.model('promotedRelated', PromotedRelatedSchema);

module.exports = PromotedRelated;
