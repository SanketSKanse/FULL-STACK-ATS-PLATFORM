const express = require('express');
const ApplicantProfile = require('../models/applicantProfile');
const Job = require('../models/job');
const Application = require('../models/application');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const profileFields = [
  'phone', 'location', 'headline', 'summary', 'interests', 'preferredJobTitles',
  'preferredWorkArrangements', 'preferredLocations', 'employmentTypes', 'skills',
  'experiences', 'education', 'projects', 'certifications', 'achievements',
  'resumeUrl', 'resumeFileName', 'resumeUploadedAt', 'profileCompleted',
];

const completion = (profile) => {
  const checks = [
    Boolean(profile.phone), Boolean(profile.location), Boolean(profile.headline),
    Boolean(profile.summary), profile.interests.length > 0, profile.skills.length > 0,
    profile.experiences.length > 0 || profile.education.length > 0,
    profile.projects.length > 0 || profile.certifications.length > 0,
    Boolean(profile.resumeFileName),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const normalized = (value) => String(value || '').trim().toLowerCase();

const validatePhone = (value) => /^\d{10}$/.test(String(value || '').trim());
const dateDigits = (value) => String(value || '').replace(/\D/g, '');
const validateExperience = (experience) => {
  const start = dateDigits(experience.startDate);
  if (start.length !== 6) return 'Experience start dates must use YYYY:MM.';
  const startYear = Number(start.slice(0, 4));
  const startMonth = Number(start.slice(4));
  const now = new Date();
  if (startYear < 1900 || startYear > now.getFullYear() || startMonth < 1 || startMonth > 12) return 'Experience start date is invalid.';
  if (startYear === now.getFullYear() && startMonth > now.getMonth() + 1) return 'Experience start date cannot be in the future.';
  if (!experience.current) {
    const end = dateDigits(experience.endDate);
    if (end.length !== 6 || Number(end.slice(4)) < 1 || Number(end.slice(4)) > 12) return 'Experience end date is invalid.';
    if (end < start) return 'Experience end date must be after the start date.';
  }
  return '';
};

router.get('/recommendations', requireAuth, requireRole('applicant'), async (req, res) => {
  try {
    const [profile, jobs, applications] = await Promise.all([
      ApplicantProfile.findOne({ userId: req.user._id }),
      Job.find({ status: 'ACTIVE' }).populate('companyId', 'name website description logo'),
      Application.find({ applicantId: req.user._id }).select('jobId'),
    ]);
    if (!profile) return res.json([]);

    const appliedIds = new Set(applications.map((application) => String(application.jobId)));
    const recommendations = jobs.filter((job) => !appliedIds.has(String(job._id))).map((job) => {
      const title = normalized(job.title);
      const location = normalized(job.location);
      const requirements = job.requirements.map(normalized);
      let score = 0;
      if (profile.preferredJobTitles.some((item) => title.includes(normalized(item)) || normalized(item).includes(title))) score += 35;
      if (profile.interests.some((item) => title.includes(normalized(item).replace(' development', '')) || normalized(job.department).includes(normalized(item).replace(' development', '')))) score += 25;
      score += Math.min(25, profile.skills.filter((skill) => requirements.some((requirement) => requirement.includes(normalized(skill)) || normalized(skill).includes(requirement))).length * 8);
      if (profile.preferredLocations.some((item) => location.includes(normalized(item)))) score += 10;
      if (profile.preferredWorkArrangements.some((item) => location.includes(normalized(item)))) score += 5;
      if (profile.employmentTypes.some((item) => normalized(job.employmentType) === normalized(item))) score += 5;
      return { ...job.toObject(), matchScore: Math.min(99, score) };
    }).filter((job) => job.matchScore > 0).sort((left, right) => right.matchScore - left.matchScore);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate job recommendations.' });
  }
});

router.get('/profile', requireAuth, requireRole('applicant'), async (req, res) => {
  try {
    const profile = await ApplicantProfile.findOne({ userId: req.user._id });
    if (!profile) return res.json({ profile: null, completion: 0 });
    res.json({ profile, completion: completion(profile) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your profile.' });
  }
});

router.put('/profile', requireAuth, requireRole('applicant'), async (req, res) => {
  try {
    const updates = {};
    profileFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (updates.phone !== undefined && updates.phone !== '' && !validatePhone(updates.phone)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit phone number.' });
    }
    if (updates.phone !== undefined) updates.phone = String(updates.phone).trim();
    if (updates.experiences !== undefined) {
      for (const experience of updates.experiences) {
        const experienceError = validateExperience(experience);
        if (experienceError) return res.status(400).json({ error: experienceError });
        experience.startDate = `${dateDigits(experience.startDate).slice(0, 4)}:${dateDigits(experience.startDate).slice(4)}`;
        if (!experience.current) experience.endDate = `${dateDigits(experience.endDate).slice(0, 4)}:${dateDigits(experience.endDate).slice(4)}`;
        else experience.endDate = '';
      }
    }
    const profile = await ApplicantProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { ...updates, userId: req.user._id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    res.json({ message: 'Profile saved successfully.', profile, completion: completion(profile) });
  } catch (err) {
    res.status(400).json({ error: 'Profile could not be saved. Check the submitted details.' });
  }
});

module.exports = router;