const mongoose = require('mongoose');

const generatedImageSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true,
  },
  url:    { type: String, required: true },
  prompt: { type: String, required: true },
  seed:   { type: Number },
  model:  { type: String, default: 'flux' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GeneratedImage', generatedImageSchema);
