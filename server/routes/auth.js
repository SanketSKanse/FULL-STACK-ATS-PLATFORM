const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Company = require('../models/company');
const Invitation = require('../models/invitation');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  title: user.title || (user.role === 'recruiter' ? 'Workspace owner' : 'Applicant'),
  companyId: user.companyId || null,
});

const issueToken = (user) => jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, companyName, companyWebsite, companyDescription, inviteToken } = req.body;
    let normalizedRole = role === 'candidate' ? 'applicant' : role;
    let assignedTitle = 'Recruiter';
    let companyId = null;

    let invitation = null;
    if (inviteToken) {
      invitation = await Invitation.findOne({
        token: inviteToken,
        status: 'PENDING',
        expiresAt: { $gt: new Date() },
      });
      if (!invitation) {
        return res.status(400).json({ error: 'Invitation link is invalid or has expired.' });
      }
      normalizedRole = 'recruiter';
      companyId = invitation.companyId;
      assignedTitle = invitation.role || 'Recruiting Lead';
    } else {
      if (!['applicant', 'recruiter'].includes(normalizedRole)) {
        return res.status(400).json({ error: 'Choose Applicant or Recruiter.' });
      }
      if (normalizedRole === 'recruiter' && !companyName) {
        return res.status(400).json({ error: 'Company name is required for recruiters.' });
      }
    }

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists. Please sign in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    if (normalizedRole === 'recruiter' && !companyId) {
      const company = await Company.create({
        name: companyName,
        website: companyWebsite || '',
        description: companyDescription || '',
      });
      companyId = company._id;
      assignedTitle = 'Workspace owner';
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: passwordHash,
      role: normalizedRole,
      title: assignedTitle,
      companyId,
    });

    if (invitation) {
      invitation.status = 'ACCEPTED';
      await invitation.save();
    }

    res.status(201).json({
      message: 'User registered successfully!',
      token: issueToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, inviteToken } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    if (inviteToken) {
      const invitation = await Invitation.findOne({
        token: inviteToken,
        status: 'PENDING',
        expiresAt: { $gt: new Date() },
      });
      if (invitation) {
        user.companyId = invitation.companyId;
        user.role = 'recruiter';
        if (invitation.role) user.title = invitation.role;
        await user.save();
        invitation.status = 'ACCEPTED';
        await invitation.save();
      }
    }

    res.json({ message: 'Logged in successfully!', token: issueToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('companyId');
  res.json({ user: publicUser(user), company: user.companyId || null });
});

module.exports = router;
