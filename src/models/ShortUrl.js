// models/ShortUrl.js
const mongoose = require('mongoose');

const shortUrlSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  longUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ShortUrl', shortUrlSchema);
