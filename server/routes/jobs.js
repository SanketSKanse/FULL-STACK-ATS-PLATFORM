const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/application');

const router = express.Router();

// 1. GET ALL JOBS (Public / For candidates & recruiters to view)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name email');
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching jobs." });
  }
});

// 2. CREATE A JOB (Recruiters only)
router.post('/', async (req, res) => {
  try {
    const { title, description, department, location, postedBy } = req.body;

    const newJob = new Job({
      title,
      description,
      department,
      location,
      postedBy
    });

    await newJob.save();
    res.status(201).json({ message: "Job created successfully!", job: newJob });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating job." });
  }
});

// 3. APPLY FOR A JOB (Candidates)
router.post('/apply', async (req, res) => {
  try {
    const { jobId, candidateId, resumeUrl } = req.body;

    // Check if already applied
    const existingApplication = await Application.findOne({ jobId, candidateId });
    if (existingApplication) {
      return res.status(400).json({ error: "You have already applied for this job." });
    }

    const newApplication = new Application({
      jobId,
      candidateId,
      resumeUrl
    });

    await newApplication.save();
    res.status(201).json({ message: "Application submitted successfully!", application: newApplication });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error submitting application." });
  }
});

module.exports = router;