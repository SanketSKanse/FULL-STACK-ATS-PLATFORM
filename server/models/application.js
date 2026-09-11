const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Applied', 'Screening', 'Shortlisted', 'Interviewing', 'Offered', 'Hired', 'Rejected'],
    default: 'Applied'
  },
  resumeUrl: { type: String, default: '' },
  coverLetter: { type: String, default: '' },
  interviewScheduledAt: { type: Date, default: null },
  interviewRound: { type: String, default: '' },
  interviewLocation: { type: String, default: '' },
  interviewNotes: { type: String, default: '' }
}, { timestamps: true });

applicationSchema.index({ applicantId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);