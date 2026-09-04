const express = require('express');
const Job = require('../models/job');
const Application = require('../models/application');
const ApplicationStatusHistory = require('../models/applicationStatusHistory');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const statusValues = ['Applied', 'Screening', 'Shortlisted', 'Interviewing', 'Offered', 'Hired', 'Rejected'];

router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'ACTIVE' })
      .populate('companyId', 'name website description logo')
      .populate('postedBy', 'name email');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job listings.' });
  }
});

router.get('/recruiter/jobs', requireAuth, requireRole('recruiter'), async (req, res) => {
  try {
    const jobs = await Job.find({ companyId: req.user.companyId })
      .populate('companyId', 'name website description logo')
      .populate('postedBy', 'name email');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your job openings.' });
  }
});

router.get('/:jobId', async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, status: { $ne: 'CLOSED' } })
      .populate('companyId', 'name website description logo')
      .populate('postedBy', 'name');
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job details.' });
  }
});

router.post('/', requireAuth, requireRole('recruiter'), async (req, res) => {
  try {
    const { title, description, department, location, employmentType, requirements, status } = req.body;
    if (!title || !description || !department || !location) {
      return res.status(400).json({ error: 'Title, description, department, and location are required.' });
    }
    if (!req.user.companyId) {
      return res.status(400).json({ error: 'Recruiter is not associated with a company.' });
    }

    const job = await Job.create({
      title,
      description,
      department,
      location,
      employmentType: employmentType || 'Full-time',
      requirements: Array.isArray(requirements) ? requirements : [],
      status: ['ACTIVE', 'DRAFT'].includes(status) ? status : 'ACTIVE',
      companyId: req.user.companyId,
      postedBy: req.user._id,
    });
    res.status(201).json({ message: 'Job posted successfully!', job });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create job posting.' });
  }
});

router.post('/apply', requireAuth, requireRole('applicant'), async (req, res) => {
  try {
    const { jobId, resumeUrl, coverLetter } = req.body;
    const job = await Job.findOne({ _id: jobId, status: 'ACTIVE' });
    if (!job) return res.status(404).json({ error: 'Active job not found.' });

    const existingApplication = await Application.findOne({ jobId, applicantId: req.user._id });
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this position.' });
    }

    const application = await Application.create({
      jobId,
      applicantId: req.user._id,
      resumeUrl: resumeUrl || '',
      coverLetter: coverLetter || '',
    });
    await ApplicationStatusHistory.create({ applicationId: application._id, status: 'Applied', changedBy: req.user._id });
    res.status(201).json({ message: 'Job application submitted successfully!', application });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'You have already applied for this position.' });
    res.status(500).json({ error: 'Failed to submit application.' });
  }
});

router.get('/applications/:recruiterId', requireAuth, requireRole('recruiter'), async (req, res) => {
  try {
    const jobs = await Job.find({ companyId: req.user.companyId }).select('_id');
    const jobIds = jobs.map((job) => job._id);
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('applicantId', 'name email')
      .populate({ path: 'jobId', select: 'title department location requirements companyId', populate: { path: 'companyId', select: 'name' } });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candidate applications.' });
  }
});

router.patch('/applications/:appId/status', requireAuth, requireRole('recruiter'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!statusValues.includes(status)) return res.status(400).json({ error: 'Invalid application status.' });

    const application = await Application.findById(req.params.appId).populate('jobId', 'companyId');
    if (!application || String(application.jobId.companyId) !== String(req.user.companyId)) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    application.status = status;
    await application.save();
    await ApplicationStatusHistory.create({ applicationId: application._id, status, changedBy: req.user._id });
    res.json({ message: 'Application status updated!', application });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update application status.' });
  }
});

router.get('/candidate/applications/:candidateId', requireAuth, requireRole('applicant'), async (req, res) => {
  try {
    const applications = await Application.find({ applicantId: req.user._id })
      .populate({ path: 'jobId', select: 'title department location employmentType companyId', populate: { path: 'companyId', select: 'name website description logo' } });
    const applicationIds = applications.map((application) => application._id);
    const histories = await ApplicationStatusHistory.find({ applicationId: { $in: applicationIds } }).sort({ createdAt: 1 });
    res.json(applications.map((application) => ({
      ...application.toObject(),
      statusHistory: histories.filter((history) => String(history.applicationId) === String(application._id)),
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your applications.' });
  }
});

module.exports = router;
