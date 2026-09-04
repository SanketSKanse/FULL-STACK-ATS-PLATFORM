const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  website: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  logo: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
