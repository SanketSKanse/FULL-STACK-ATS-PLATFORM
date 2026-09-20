const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../models/notification');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/notifications
 * Retrieves real-time persistent notifications for the authenticated user.
 * Zero duplicate synthesis: notifications are created once when events occur.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Semantic deduplication filter: guarantees zero duplicate notifications across all pages
    const seen = new Set();
    const deduplicated = [];

    for (const notif of notifications) {
      const appId = notif.metadata?.applicationId || (notif.link && notif.link.length === 24 ? notif.link : '');
      const jobId = notif.metadata?.jobId || '';
      const status = notif.metadata?.status || '';
      const normMsg = (notif.message || '').replace(/["'\\]/g, '').replace(/\s+/g, ' ').trim();

      let dedupeKey;
      if (notif.synthKey) {
        dedupeKey = notif.synthKey;
      } else if (notif.type === 'NEW_APPLICATION' && appId) {
        dedupeKey = `synth-app-${appId}`;
      } else if (notif.type === 'APPLICATION_PROGRESS' && appId) {
        dedupeKey = `synth-stat-${appId}-${status}`;
      } else if (notif.type === 'NEW_JOB' && jobId) {
        dedupeKey = `synth-job-${jobId}`;
      } else {
        dedupeKey = `${notif.type}_${notif.title}_${normMsg}`;
      }

      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        deduplicated.push(notif);
      }
    }

    res.json(deduplicated);
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marks an individual notification as read.
 */
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (mongoose.Types.ObjectId.isValid(id)) {
      await Notification.findOneAndUpdate({ _id: id, userId }, { read: true });
    } else {
      await Notification.updateMany({ synthKey: id, userId }, { read: true });
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Marks ALL notifications as read for current user in MongoDB.
 */
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await Notification.updateMany({ userId, read: false }, { read: true });
    res.json({ success: true, count: result.modifiedCount, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error marking all notifications read:', err);
    res.status(500).json({ error: 'Failed to mark notifications read.' });
  }
});

module.exports = router;
