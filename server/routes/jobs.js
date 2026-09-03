const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');

const router = express.Router();

// 1. GET ALL JOBS (Public/Candidate board view)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name email');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch job listings." });
  }
});

// 2. CREATE A JOB (Recruiter view)
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
    res.status(201).json({ message: "Job posted successfully!", job: newJob });
  } catch (err) {
    res.status(500).json({ error: "Failed to create job posting." });
  }
});

// 3. APPLY FOR A JOB (Candidate view)
router.post('/apply', async (req, res) => {
  try {
    const { jobId, candidateId, resumeUrl } = req.body;

    const existingApplication = await Application.findOne({ jobId, candidateId });
    if (existingApplication) {
      return res.status(400).json({ error: "You have already applied for this position." });
    }

    const newApplication = new Application({
      jobId,
      candidateId,
      resumeUrl: resumeUrl || ''
    });

    await newApplication.save();
    res.status(201).json({ message: "Job application submitted successfully!", application: newApplication });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit application." });
  }
});

// 4. GET APPLICATIONS FOR A RECRUITER'S JOBS
router.get('/applications/:recruiterId', async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    const jobs = await Job.find({ postedBy: recruiterId });
    const jobIds = jobs.map(job => job._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('candidateId', 'name email')
      .populate('jobId', 'title');

    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch candidate applications." });
  }
});

// 5. UPDATE APPLICATION STATUS
router.patch('/applications/:appId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedApp = await Application.findByIdAndUpdate(
      req.params.appId,
      { status },
      { new: true }
    );
    res.json({ message: "Application status updated!", application: updatedApp });
  } catch (err) {
    res.status(500).json({ error: "Failed to update application status." });
  }
});

// 6. GET APPLICATIONS SUBMITTED BY A SPECIFIC CANDIDATE
router.get('/candidate/applications/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    const applications = await Application.find({ candidateId })
      .populate('jobId', 'title department location');

    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch your applications." });
  }
});

module.exports = router;