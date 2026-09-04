const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  company: { type: String, default: '' },
  title: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  current: { type: Boolean, default: false },
  location: { type: String, default: '' },
  description: { type: String, default: '' },
}, { _id: true });

const educationSchema = new mongoose.Schema({
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  fieldOfStudy: { type: String, default: '' },
  startYear: { type: String, default: '' },
  endYear: { type: String, default: '' },
  current: { type: Boolean, default: false },
}, { _id: true });

const projectSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  technologies: { type: [String], default: [] },
  url: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
}, { _id: true });

const certificationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  issuer: { type: String, default: '' },
  issueDate: { type: String, default: '' },
  credentialId: { type: String, default: '' },
  credentialUrl: { type: String, default: '' },
}, { _id: true });

const achievementSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  organization: { type: String, default: '' },
  date: { type: String, default: '' },
  description: { type: String, default: '' },
  url: { type: String, default: '' },
}, { _id: true });

const applicantProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  headline: { type: String, default: '' },
  summary: { type: String, default: '' },
  interests: { type: [String], default: [] },
  preferredJobTitles: { type: [String], default: [] },
  preferredWorkArrangements: { type: [String], default: [] },
  preferredLocations: { type: [String], default: [] },
  employmentTypes: { type: [String], default: [] },
  skills: { type: [String], default: [] },
  experiences: { type: [experienceSchema], default: [] },
  education: { type: [educationSchema], default: [] },
  projects: { type: [projectSchema], default: [] },
  certifications: { type: [certificationSchema], default: [] },
  achievements: { type: [achievementSchema], default: [] },
  resumeUrl: { type: String, default: '' },
  resumeFileName: { type: String, default: '' },
  resumeUploadedAt: { type: Date, default: null },
  profileCompleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ApplicantProfile', applicantProfileSchema);