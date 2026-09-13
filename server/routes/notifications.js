const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../models/notification');
const Application = require('../models/application');
const Job = require('../models/job');
const ApplicationStatusHistory = require('../models/applicationStatusHistory');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/notifications
 * Retrieves notifications for the logged-in user (recruiter or applicant).
 * Combines stored persistent notifications with live synthesized activity.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // 1. Fetch saved notifications in database
    const savedNotifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(30);
    const savedMap = new Map();
    savedNotifications.forEach((n) => savedMap.set(String(n._id), n));

    const synthesized = [];

    if (userRole === 'recruiter') {
      // Find jobs belonging to recruiter's company (or all if not scoped)
      const jobFilter = req.user.companyId ? { companyId: req.user.companyId } : {};
      const companyJobs = await Job.find(jobFilter).select('_id title department');
      const jobIds = companyJobs.map((j) => j._id);
      const jobMap = new Map();
      companyJobs.forEach((j) => jobMap.set(String(j._id), j));

      // Query applications for these jobs
      const applications = await Application.find({ jobId: { $in: jobIds } })
        .populate('applicantId', 'name email')
        .sort({ createdAt: -1 })
        .limit(20);

      for (const app of applications) {
        const job = jobMap.get(String(app.jobId?._id || app.jobId));
        const applicantName = app.applicantId?.name || 'A candidate';
        const jobTitle = job?.title || 'Open Position';

        // Event A: Candidate applied
        synthesized.push({
          _id: `synth-app-${app._id}`,
          userId,
          title: 'New Candidate Applied',
          message: `${applicantName} submitted an application for ${jobTitle}.`,
          type: 'NEW_APPLICATION',
          link: String(app._id),
          metadata: { applicationId: String(app._id), candidateId: String(app._id), candidateName: applicantName, jobTitle },
          read: false,
          createdAt: app.createdAt || new Date(),
        });

        // Event B: Interview scheduled
        if (app.interviewScheduledAt) {
          synthesized.push({
            _id: `synth-int-${app._id}`,
            userId,
            title: 'Interview Scheduled',
            message: `${app.interviewRound || 'Interview'} with ${applicantName} for ${jobTitle} is scheduled for ${new Date(app.interviewScheduledAt).toLocaleString()}.`,
            type: 'INTERVIEW_SCHEDULED',
            link: 'Interviews',
            metadata: { applicationId: String(app._id), candidateId: String(app._id), candidateName: applicantName, jobTitle },
            read: false,
            createdAt: app.updatedAt || app.createdAt,
          });
        }
      }
    } else {
      // Applicant notifications
      const applications = await Application.find({ applicantId: userId })
        .populate({ path: 'jobId', select: 'title companyId', populate: { path: 'companyId', select: 'name' } })
        .sort({ updatedAt: -1 })
        .limit(15);

      for (const app of applications) {
        const jobTitle = app.jobId?.title || 'Applied Position';
        const companyName = app.jobId?.companyId?.name || 'Hiring Team';

        // Event A: Progress status change (beyond applied)
        if (app.status && app.status !== 'Applied') {
          synthesized.push({
            _id: `synth-stat-${app._id}-${app.status}`,
            userId,
            title: `Application Moved to ${app.status}`,
            message: `Your application for ${jobTitle} at ${companyName} has advanced to "${app.status}".`,
            type: 'APPLICATION_PROGRESS',
            link: 'Applications',
            metadata: { applicationId: String(app._id), status: app.status },
            read: false,
            createdAt: app.updatedAt || app.createdAt,
          });
        }

        // Event B: Interview scheduled
        if (app.interviewScheduledAt) {
          synthesized.push({
            _id: `synth-appint-${app._id}`,
            userId,
            title: 'Interview Invitation',
            message: `An interview (${app.interviewRound || 'Round'}) has been scheduled for ${jobTitle} on ${new Date(app.interviewScheduledAt).toLocaleString()}.`,
            type: 'INTERVIEW_SCHEDULED',
            link: 'Applications',
            metadata: { applicationId: String(app._id), scheduledAt: app.interviewScheduledAt },
            read: false,
            createdAt: app.interviewScheduledAt,
          });
        }
      }

      // Event C: Newly posted active jobs
      const recentJobs = await Job.find({ status: 'ACTIVE' })
        .populate('companyId', 'name')
        .sort({ createdAt: -1 })
        .limit(6);

      for (const job of recentJobs) {
        synthesized.push({
          _id: `synth-job-${job._id}`,
          userId,
          title: 'New Job Opening',
          message: `${job.companyId?.name || 'A company'} just posted a new opening: "${job.title}". Check if your skills match!`,
          type: 'NEW_JOB',
          link: 'Browse',
          metadata: { jobId: String(job._id) },
          read: false,
          createdAt: job.createdAt,
        });
      }
    }

    // Combine saved and synthesized notifications, avoiding exact duplicates by ID
    const combined = [...savedNotifications];
    const seenIds = new Set(savedNotifications.map((n) => String(n._id)));

    synthesized.forEach((item) => {
      if (!seenIds.has(item._id)) {
        seenIds.add(item._id);
        combined.push(item);
      }
    });

    // Sort descending by date
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(combined);
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a notification as read (creates persistent record if synthesized).
 */
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.Types.ObjectId.isValid(id)) {
      await Notification.findByIdAndUpdate(id, { read: true });
    } else {
      // Synthesized notification marked read - save read record
      await Notification.create({
        userId: req.user._id,
        title: req.body.title || 'Notification',
        message: req.body.message || '',
        type: req.body.type || 'GENERAL',
        link: req.body.link || '',
        read: true,
      });
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications as read for current user.
 */
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications read.' });
  }
});

module.exports = router;
