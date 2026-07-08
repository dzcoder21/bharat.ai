const mongoose = require('mongoose');
const searchSchema = new mongoose.Schema({
  query:       { type: String, required: true, trim: true, index: true },
  cleanQuery:  { type: String },
  intent:      { type: String },
  language:    { type: String },
  resultCount: { type: Number, default: 0 },
  elapsedMs:   { type: Number },
  searchedAt:  { type: Date, default: Date.now, index: true },
});
searchSchema.index({ searchedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
module.exports = mongoose.model('Search', searchSchema);
