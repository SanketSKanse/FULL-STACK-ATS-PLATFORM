const express = require('express');
const mongoose = require('mongoose');
const Job = require('../models/job');
const Application = require('../models/application');
const ApplicationStatusHistory = require('../models/applicationStatusHistory');
const ApplicantProfile = require('../models/applicantProfile');
const User = require('../models/user');
const Notification = require('../models/notification');
const { calculateMatch } = require('../services/matchingService');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const statusValues = ['Applied', 'Screening', 'Shortlisted', 'Interviewing', 'Offered', 'Hired', 'Rejected'];

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

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

router.patch('/recruiter/jobs/:jobId/status', requireAuth, requireRole('recruiter'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'CLOSED'].includes(status)) return res.status(400).json({ error: 'Invalid job status.' });

    const job = await Job.findOneAndUpdate(
      { _id: req.params.jobId, companyId: req.user.companyId },
      { status },
      { new: true },
    ).populate('postedBy', 'name email');
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    res.json({ message: status === 'CLOSED' ? 'Hiring paused for this job.' : 'Hiring reopened for this job.', job });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update job status.' });
  }
});

router.delete('/recruiter/jobs/:jobId', requireAuth, requireRole('recruiter'), async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID.' });
    }

    const job = await Job.findOne({ _id: jobId, companyId: req.user.companyId });
    if (!job) {
      return res.status(404).json({ error: 'Job posting not found or unauthorized.' });
    }

    // Cascade delete associated applications and timeline status histories
    const applications = await Application.find({ jobId: job._id });
    const applicationIds = applications.map((app) => app._id);

    if (applicationIds.length > 0) {
      await ApplicationStatusHistory.deleteMany({ applicationId: { $in: applicationIds } });
      await Application.deleteMany({ jobId: job._id });
    }

    await Job.findByIdAndDelete(job._id);

    res.json({ message: 'Job posting and all associated applications deleted successfully.', jobId });
  } catch (err) {
    console.error('Failed to delete job posting:', err);
    res.status(500).json({ error: 'Failed to delete job posting.' });
  }
});

// 1. Explainable Candidate Matching Endpoint
router.get('/:jobId/match/:candidateId', requireAuth, async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId) || !mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ error: 'Valid jobId and candidateId are required.' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job posting not found.' });
    }

    // Support matching candidateId against both User._id (applicantId) and ApplicantProfile._id
    let profile = await ApplicantProfile.findOne({
      $or: [{ userId: candidateId }, { _id: candidateId }]
    });

    if (!profile) {
      const userExists = await User.findById(candidateId);
      if (!userExists) {
        return res.status(404).json({ error: 'Candidate profile or user not found.' });
      }

      return res.json({
        matchScore: 0,
        matchingSkills: [],
        missingSkills: job.requirements || [],
        recommendationReason: 'Candidate has not completed their profile yet.',
        breakdown: { skillsScore: 0, experienceScore: 0, contextScore: 0, totalWeight: 100 },
        candidateYears: 0,
        requiredExperienceYears: 0
      });
    }

    const matchData = calculateMatch(job, profile);
    return res.json(matchData);
  } catch (err) {
    console.error('Candidate match evaluation error:', err);
    return res.status(500).json({ error: 'Failed to calculate candidate match.' });
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

router.post('/apply', requireAuth, requireRole('applicant'), upload.single('resume'), async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    const job = await Job.findOne({ _id: jobId, status: 'ACTIVE' });
    if (!job) return res.status(404).json({ error: 'Active job not found.' });

    const existingApplication = await Application.findOne({ jobId, applicantId: req.user._id });
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this position.' });
    }

    const application = await Application.create({
      jobId,
      applicantId: req.user._id,
      resumeUrl: req.file ? `http://localhost:5001/uploads/${req.file.filename}` : '',
      coverLetter: coverLetter || '',
    });
    await ApplicationStatusHistory.create({ applicationId: application._id, status: 'Applied', changedBy: req.user._id });
    
    // Notify recruiter of new applicant
    if (job.postedBy) {
      await Notification.create({
        userId: job.postedBy,
        title: 'New Candidate Applied',
        message: `${req.user.name || 'A candidate'} submitted an application for "${job.title}".`,
        type: 'NEW_APPLICATION',
        link: String(application._id),
        metadata: { applicationId: application._id, candidateId: req.user._id, jobTitle: job.title },
      }).catch((e) => console.error('Notification creation error:', e));
    }

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
      .populate({ path: 'jobId', select: 'title department location employmentType requirements description companyId', populate: { path: 'companyId', select: 'name' } });
    
    const applicationIds = applications.map((application) => application._id);
    const histories = await ApplicationStatusHistory.find({ applicationId: { $in: applicationIds } }).sort({ createdAt: 1 });
    
    // Fetch applicant profiles to provide real candidate skills and compute dynamic match fit
    const applicantUserIds = applications.map((app) => app.applicantId?._id).filter(Boolean);
    const profiles = await ApplicantProfile.find({ userId: { $in: applicantUserIds } });
    const profileMap = new Map();
    profiles.forEach((profile) => {
      profileMap.set(String(profile.userId), profile);
    });

    res.json(applications.map((application) => {
      const applicantUserId = application.applicantId?._id ? String(application.applicantId._id) : null;
      const candidateProfile = applicantUserId ? profileMap.get(applicantUserId) : null;

      let match = null;
      if (candidateProfile && application.jobId) {
        match = calculateMatch(application.jobId, candidateProfile);
      } else {
        match = {
          matchScore: 0,
          matchingSkills: [],
          missingSkills: application.jobId?.requirements || [],
          recommendationReason: candidateProfile ? 'Profile needs additional details for analysis.' : 'Candidate has not completed their profile yet.',
          breakdown: { skillsScore: 0, experienceScore: 0, contextScore: 0, totalWeight: 100 },
          candidateYears: 0,
          requiredExperienceYears: 0,
        };
      }

      return {
        ...application.toObject(),
        candidateProfile: candidateProfile || null,
        match,
        statusHistory: histories.filter((history) => String(history.applicationId) === String(application._id)),
      };
    }));
  } catch (err) {
    console.error('Failed to fetch recruiter applications:', err);
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

    if (status === 'Offered' && !application.interviewScheduledAt) {
      return res.status(400).json({ error: 'Schedule at least one interview before making an offer.' });
    }

    application.status = status;
    await application.save();
    await ApplicationStatusHistory.create({ applicationId: application._id, status, changedBy: req.user._id });
    
    // Notify candidate of status progression
    await Notification.create({
      userId: application.applicantId,
      title: `Application Moved to ${status}`,
      message: `Your application for "${application.jobId?.title || 'the position'}" has advanced to "${status}".`,
      type: 'APPLICATION_PROGRESS',
      link: 'Applications',
      metadata: { applicationId: application._id, status },
    }).catch((e) => console.error('Notification creation error:', e));

    const statusHistory = await ApplicationStatusHistory.find({ applicationId: application._id }).sort({ createdAt: 1 });
    res.json({ message: 'Application status updated!', application, statusHistory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update application status.' });
  }
});

router.patch('/applications/:appId/interview', requireAuth, requireRole('recruiter'), async (req, res) => {
  try {
    const { scheduledAt, round, location, notes } = req.body;
    if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) {
      return res.status(400).json({ error: 'A valid interview date and time are required.' });
    }

    const application = await Application.findById(req.params.appId).populate('jobId', 'title companyId');
    if (!application || String(application.jobId.companyId) !== String(req.user.companyId)) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    application.interviewScheduledAt = new Date(scheduledAt);
    application.interviewRound = round || 'Assessment';
    application.interviewLocation = location || '';
    application.interviewNotes = notes || '';
    application.status = 'Interviewing';
    await application.save();
    await ApplicationStatusHistory.create({ applicationId: application._id, status: 'Interviewing', changedBy: req.user._id });
    
    // Notify candidate of interview
    await Notification.create({
      userId: application.applicantId,
      title: 'Interview Scheduled',
      message: `An interview (${round || 'Assessment'}) has been scheduled for "${application.jobId?.title || 'your applied position'}" on ${new Date(scheduledAt).toLocaleString()}.`,
      type: 'INTERVIEW_SCHEDULED',
      link: 'Applications',
      metadata: { applicationId: application._id, scheduledAt },
    }).catch((e) => console.error('Notification creation error:', e));

    // Notify recruiter of confirmation
    await Notification.create({
      userId: req.user._id,
      title: 'Interview Confirmed',
      message: `Interview (${round || 'Assessment'}) scheduled on ${new Date(scheduledAt).toLocaleString()}.`,
      type: 'INTERVIEW_SCHEDULED',
      link: 'Interviews',
      metadata: { applicationId: application._id, scheduledAt },
    }).catch((e) => console.error('Notification creation error:', e));

    const statusHistory = await ApplicationStatusHistory.find({ applicationId: application._id }).sort({ createdAt: 1 });
    res.json({ message: 'Interview scheduled.', application, statusHistory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to schedule interview.' });
  }
});

router.get('/candidate/applications/:candidateId', requireAuth, requireRole('applicant'), async (req, res) => {
  try {
    const applications = await Application.find({ applicantId: req.user._id })
      .populate({ path: 'jobId', select: 'title department location employmentType requirements description companyId', populate: { path: 'companyId', select: 'name website description logo' } });
    const applicationIds = applications.map((application) => application._id);
    const histories = await ApplicationStatusHistory.find({ applicationId: { $in: applicationIds } }).sort({ createdAt: 1 });
    
    const candidateProfile = await ApplicantProfile.findOne({ userId: req.user._id });

    res.json(applications.map((application) => {
      let match = null;
      if (candidateProfile && application.jobId) {
        match = calculateMatch(application.jobId, candidateProfile);
      } else {
        match = {
          matchScore: 0,
          matchingSkills: [],
          missingSkills: application.jobId?.requirements || [],
          recommendationReason: 'Complete your profile to see your alignment breakdown.',
          breakdown: { skillsScore: 0, experienceScore: 0, contextScore: 0, totalWeight: 100 },
          candidateYears: 0,
          requiredExperienceYears: 0,
        };
      }

      return {
        ...application.toObject(),
        candidateProfile: candidateProfile || null,
        match,
        statusHistory: histories.filter((history) => String(history.applicationId) === String(application._id)),
      };
    }));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your applications.' });
  }
});

module.exports = router;
