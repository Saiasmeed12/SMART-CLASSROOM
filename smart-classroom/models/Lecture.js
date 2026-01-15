const mongoose = require('mongoose');
const s = new mongoose.Schema({
  title: String,
  filePath: String,
  fileType: String,
  status: String,
  summary: String,
  quiz: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Lecture', s);
