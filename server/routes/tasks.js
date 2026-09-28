const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const Application = require('../models/application');
const Job = require('../models/job');
const { requireAuth, requireRole } = require('../middleware/auth');

// All task routes require recruiter authentication
router.use(requireAuth);
router.use(requireRole('recruiter'));

/**
 * GET /api/tasks
 * Retrieve all tasks for the recruiter's workspace, plus live pipeline suggestions
 */
router.get('/', async (req, res) => {
  try {
    const userFilter = req.user.companyId
      ? { $or: [{ createdBy: req.user._id }, { companyId: req.user.companyId }] }
      : { createdBy: req.user._id };

    let tasks = await Task.find(userFilter)
      .populate('relatedJob', 'title department location')
      .populate({
        path: 'relatedCandidate',
        populate: { path: 'applicantId', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    // Seed realistic starter tasks if user has no tasks yet
    if (tasks.length === 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 4);

      const starterTasks = [
        {
          title: 'Review new candidate applications in pipeline',
          description: 'Evaluate incoming resume submissions and tag suitable candidates for screening.',
          priority: 'HIGH',
          category: 'CANDIDATE_REVIEW',
          dueDate: tomorrow,
          createdBy: req.user._id,
          companyId: req.user.companyId || null,
        },
        {
          title: 'Prepare interview questions & evaluation rubric',
          description: 'Align with hiring managers on technical competency bars and scorecard criteria.',
          priority: 'MEDIUM',
          category: 'INTERVIEW_PREP',
          dueDate: nextWeek,
          createdBy: req.user._id,
          companyId: req.user.companyId || null,
        },
        {
          title: 'Conduct weekly hiring sync with engineering managers',
          description: 'Discuss open requisition timelines, offer approvals, and headcount planning.',
          priority: 'LOW',
          category: 'TEAM_SYNC',
          dueDate: nextWeek,
          createdBy: req.user._id,
          companyId: req.user.companyId || null,
        }
      ];

      await Task.insertMany(starterTasks);
      tasks = await Task.find(userFilter)
        .populate('relatedJob', 'title department location')
        .populate({
          path: 'relatedCandidate',
          populate: { path: 'applicantId', select: 'name email' }
        })
        .sort({ createdAt: -1 });
    }

    // Build smart action items dynamically from live ATS state
    const jobFilter = req.user.companyId ? { companyId: req.user.companyId } : { postedBy: req.user._id };
    const liveJobs = await Job.find(jobFilter).select('_id title department');
    const jobIds = liveJobs.map(j => j._id);

    const pendingApps = await Application.find({
      jobId: { $in: jobIds },
      status: { $in: ['Applied', 'Interviewing', 'Offered'] }
    })
      .populate('applicantId', 'name email')
      .populate('jobId', 'title department')
      .limit(10);

    const suggestions = [];

    pendingApps.forEach(app => {
      const applicantName = app.applicantId?.name || 'Applicant';
      const roleTitle = app.jobId?.title || 'open role';

      if (app.status === 'Applied') {
        suggestions.push({
          type: 'CANDIDATE_SCREEN',
          title: `Screen application for ${applicantName} (${roleTitle})`,
          category: 'CANDIDATE_REVIEW',
          priority: 'HIGH',
          applicationId: app._id,
          jobId: app.jobId?._id,
        });
      } else if (app.status === 'Interviewing' && app.interviewScheduledAt) {
        suggestions.push({
          type: 'INTERVIEW_DEBRIEF',
          title: `Prepare ${app.interviewRound || 'Interview'} scorecard for ${applicantName}`,
          category: 'INTERVIEW_PREP',
          priority: 'URGENT',
          applicationId: app._id,
          jobId: app.jobId?._id,
        });
      } else if (app.status === 'Offered') {
        suggestions.push({
          type: 'OFFER_FOLLOWUP',
          title: `Follow up on offer letter sent to ${applicantName}`,
          category: 'OFFER_MANAGEMENT',
          priority: 'HIGH',
          applicationId: app._id,
          jobId: app.jobId?._id,
        });
      }
    });

    res.json({
      tasks,
      suggestions: suggestions.slice(0, 5)
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, relatedJob, relatedCandidate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const task = new Task({
      title: title.trim(),
      description: (description || '').trim(),
      priority: priority || 'MEDIUM',
      category: category || 'GENERAL',
      dueDate: dueDate ? new Date(dueDate) : null,
      relatedJob: relatedJob || null,
      relatedCandidate: relatedCandidate || null,
      createdBy: req.user._id,
      companyId: req.user.companyId || null,
      status: 'PENDING',
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('relatedJob', 'title department location')
      .populate({
        path: 'relatedCandidate',
        populate: { path: 'applicantId', select: 'name email' }
      });

    res.status(201).json({
      message: 'Task created successfully.',
      task: populatedTask
    });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

/**
 * PATCH /api/tasks/:id/toggle
 * Toggle completion status
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const userFilter = req.user.companyId
      ? { _id: req.params.id, $or: [{ createdBy: req.user._id }, { companyId: req.user.companyId }] }
      : { _id: req.params.id, createdBy: req.user._id };

    const task = await Task.findOne(userFilter);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    task.status = nextStatus;
    task.completedAt = nextStatus === 'COMPLETED' ? new Date() : null;

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('relatedJob', 'title department location')
      .populate({
        path: 'relatedCandidate',
        populate: { path: 'applicantId', select: 'name email' }
      });

    res.json({
      message: nextStatus === 'COMPLETED' ? 'Task marked as completed.' : 'Task reopened.',
      task: populatedTask
    });
  } catch (err) {
    console.error('Error toggling task:', err);
    res.status(500).json({ error: 'Failed to update task status.' });
  }
});

/**
 * PATCH /api/tasks/:id
 * Update task details
 */
router.patch('/:id', async (req, res) => {
  try {
    const userFilter = req.user.companyId
      ? { _id: req.params.id, $or: [{ createdBy: req.user._id }, { companyId: req.user.companyId }] }
      : { _id: req.params.id, createdBy: req.user._id };

    const task = await Task.findOne(userFilter);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const { title, description, priority, category, dueDate, relatedJob, relatedCandidate, status } = req.body;

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (relatedJob !== undefined) task.relatedJob = relatedJob || null;
    if (relatedCandidate !== undefined) task.relatedCandidate = relatedCandidate || null;
    if (status !== undefined) {
      task.status = status;
      task.completedAt = status === 'COMPLETED' ? new Date() : null;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('relatedJob', 'title department location')
      .populate({
        path: 'relatedCandidate',
        populate: { path: 'applicantId', select: 'name email' }
      });

    res.json({
      message: 'Task updated successfully.',
      task: populatedTask
    });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a single task
 */
router.delete('/:id', async (req, res) => {
  try {
    const userFilter = req.user.companyId
      ? { _id: req.params.id, $or: [{ createdBy: req.user._id }, { companyId: req.user.companyId }] }
      : { _id: req.params.id, createdBy: req.user._id };

    const task = await Task.findOneAndDelete(userFilter);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

/**
 * DELETE /api/tasks/completed/all
 * Clear all completed tasks for clean workspace
 */
router.delete('/completed/all', async (req, res) => {
  try {
    const userFilter = req.user.companyId
      ? { status: 'COMPLETED', $or: [{ createdBy: req.user._id }, { companyId: req.user.companyId }] }
      : { status: 'COMPLETED', createdBy: req.user._id };

    const result = await Task.deleteMany(userFilter);
    res.json({ message: `Cleared ${result.deletedCount} completed tasks.` });
  } catch (err) {
    console.error('Error clearing completed tasks:', err);
    res.status(500).json({ error: 'Failed to clear completed tasks.' });
  }
});

module.exports = router;
