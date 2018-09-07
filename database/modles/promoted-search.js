const mongoose = require('mongoose');
const arrayUniquePlugin = require('mongoose-unique-array');
const Schema = mongoose.Schema;
const promotionsSchema = require('../promotions-schema');

const promotedSearchSchema = new Schema(promotionsSchema);

promotedSearchSchema.plugin(arrayUniquePlugin);

const promotedSearch = mongoose.model('promotedSearch', promotedSearchSchema);

module.exports = promotedSearch;
