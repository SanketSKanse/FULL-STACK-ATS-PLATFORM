const express = require('express');
const crypto = require('crypto');
const User = require('../models/user');
const Company = require('../models/company');
const Invitation = require('../models/invitation');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendInvitationEmail } = require('../services/emailService');

const router = express.Router();

/**
 * GET /api/team
 * Returns active workspace members and pending invites for the recruiter's company.
 */
router.get('/', requireAuth, requireRole('recruiter'), async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({ error: 'Recruiter is not associated with a company.' });
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const members = await User.find({ companyId: req.user.companyId })
      .select('name email role title createdAt')
      .sort({ createdAt: 1 });

    const pendingInvitations = await Invitation.find({
      companyId: req.user.companyId,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      company: {
        id: company._id,
        name: company.name,
        website: company.website,
        description: company.description,
      },
      members,
      pendingInvitations,
    });
  } catch (err) {
    console.error('[TeamRoute] Error fetching team:', err);
    res.status(500).json({ error: 'Failed to fetch team members.' });
  }
});

/**
 * POST /api/team/invite
 * Sends a real invitation email to a colleague to join the hiring workspace.
 */
router.post('/invite', requireAuth, requireRole('recruiter'), async (req, res) => {
  try {
    const { name, email, role, note } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const assignedRole = (role && role.trim()) ? role.trim() : 'Recruiting Lead';

    if (!req.user.companyId) {
      return res.status(400).json({ error: 'You must have an active company workspace to invite teammates.' });
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company workspace not found.' });
    }

    // Check if recipient is already a member of this company
    const existingMember = await User.findOne({
      email: normalizedEmail,
      companyId: req.user.companyId,
    });

    if (existingMember) {
      return res.status(400).json({ error: `${name} (${normalizedEmail}) is already an active member of your company workspace.` });
    }

    // Generate secure token and 7-day expiration
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Upsert invitation: replace any existing pending invite for this email in this company
    let invitation = await Invitation.findOne({
      email: normalizedEmail,
      companyId: req.user.companyId,
      status: 'PENDING',
    });

    if (invitation) {
      invitation.name = name.trim();
      invitation.role = assignedRole;
      invitation.note = (note || '').trim();
      invitation.token = token;
      invitation.expiresAt = expiresAt;
      invitation.invitedBy = req.user._id;
      await invitation.save();
    } else {
      invitation = await Invitation.create({
        companyId: req.user.companyId,
        invitedBy: req.user._id,
        name: name.trim(),
        email: normalizedEmail,
        role: assignedRole,
        note: (note || '').trim(),
        token,
        status: 'PENDING',
        expiresAt,
      });
    }

    // Compose invite URL
    const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
    const inviteUrl = `${appUrl}/?inviteToken=${token}`;

    // Send actual email via nodemailer
    const emailResult = await sendInvitationEmail({
      to: normalizedEmail,
      name: name.trim(),
      inviterName: req.user.name || 'Your Colleague',
      companyName: company.name,
      role: assignedRole,
      note: (note || '').trim(),
      inviteUrl,
    });

    res.status(201).json({
      message: emailResult.isTestAccount
        ? `Test preview generated! (To send to actual inboxes, add your Gmail App Password to server/.env)`
        : `Invitation email dispatched directly to ${normalizedEmail}!`,
      invitation: {
        id: invitation._id,
        name: invitation.name,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
      previewUrl: emailResult.previewUrl,
      isTestAccount: emailResult.isTestAccount,
    });
  } catch (err) {
    console.error('[TeamRoute] Error inviting teammate:', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch invitation email.' });
  }
});

/**
 * POST /api/team/invite/:id/resend
 * Resends the invitation email with a fresh token.
 */
router.post('/invite/:id/resend', requireAuth, requireRole('recruiter'), async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
      status: 'PENDING',
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Pending invitation not found.' });
    }

    const company = await Company.findById(req.user.companyId);

    // Refresh token and expiry
    invitation.token = crypto.randomBytes(32).toString('hex');
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitation.save();

    const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
    const inviteUrl = `${appUrl}/?inviteToken=${invitation.token}`;

    const emailResult = await sendInvitationEmail({
      to: invitation.email,
      name: invitation.name,
      inviterName: req.user.name || 'Your Colleague',
      companyName: company?.name || 'AvantHire',
      role: invitation.role,
      note: invitation.note,
      inviteUrl,
    });

    res.json({
      message: emailResult.isTestAccount
        ? `Test preview re-sent! (Configure Gmail App Password in server/.env for real inboxes)`
        : `Invitation re-sent directly to ${invitation.email}!`,
      previewUrl: emailResult.previewUrl,
      isTestAccount: emailResult.isTestAccount,
    });
  } catch (err) {
    console.error('[TeamRoute] Error resending invite:', err);
    res.status(500).json({ error: 'Failed to resend invitation email.' });
  }
});

/**
 * DELETE /api/team/invite/:id
 * Cancels or revokes a pending invitation.
 */
router.delete('/invite/:id', requireAuth, requireRole('recruiter'), async (req, res) => {
  try {
    const invitation = await Invitation.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }

    res.json({ message: 'Invitation cancelled successfully.' });
  } catch (err) {
    console.error('[TeamRoute] Error deleting invite:', err);
    res.status(500).json({ error: 'Failed to cancel invitation.' });
  }
});

/**
 * GET /api/team/invite-info/:token
 * Public endpoint: reads invitation metadata to customize the registration form.
 */
router.get('/invite-info/:token', async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      token: req.params.token,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    })
      .populate('companyId', 'name website description')
      .populate('invitedBy', 'name email');

    if (!invitation) {
      return res.status(404).json({
        error: 'This invitation link is invalid or has expired. Please ask your workspace owner for a new invitation.',
      });
    }

    res.json({
      valid: true,
      name: invitation.name,
      email: invitation.email,
      role: invitation.role,
      note: invitation.note,
      companyName: invitation.companyId?.name || 'Workspace',
      inviterName: invitation.invitedBy?.name || 'Workspace Owner',
    });
  } catch (err) {
    console.error('[TeamRoute] Error checking invite info:', err);
    res.status(500).json({ error: 'Failed to verify invitation link.' });
  }
});

module.exports = router;
