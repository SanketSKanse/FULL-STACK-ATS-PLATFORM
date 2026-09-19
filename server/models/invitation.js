const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
    default: 'Recruiter',
    trim: true,
  },
  note: {
    type: String,
    default: '',
    trim: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'],
    default: 'PENDING',
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Invitation', invitationSchema);
