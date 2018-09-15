const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;
const promotionsSchema = require('../promotions-schema');

const PromotedSearchSchema = new Schema(promotionsSchema);

PromotedSearchSchema.plugin(arrayUniquePlugin);

const PromotedSearch = mongoose.model('promotedSearch', PromotedSearchSchema);

module.exports = PromotedSearch;
