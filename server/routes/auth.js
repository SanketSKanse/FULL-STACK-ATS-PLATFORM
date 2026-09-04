const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Company = require('../models/company');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  companyId: user.companyId || null,
});

const issueToken = (user) => jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, companyName, companyWebsite, companyDescription } = req.body;
    const normalizedRole = role === 'candidate' ? 'applicant' : role;

    if (!['applicant', 'recruiter'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'Choose Applicant or Recruiter.' });
    }
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (normalizedRole === 'recruiter' && !companyName) {
      return res.status(400).json({ error: 'Company name is required for recruiters.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let companyId = null;
    if (normalizedRole === 'recruiter') {
      const company = await Company.create({
        name: companyName,
        website: companyWebsite || '',
        description: companyDescription || '',
      });
      companyId = company._id;
    }

    const user = await User.create({ name, email, password: passwordHash, role: normalizedRole, companyId });
    res.status(201).json({ message: 'User registered successfully!', user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid email or password.' });
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
