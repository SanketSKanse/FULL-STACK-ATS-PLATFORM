const express = require('express');
const multer = require('multer');
const { parseResumeBuffer } = require('../services/resumeParserService');

const router = express.Router();

// Memory storage for multer: processes files directly in memory without disk persistence
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported for resume parsing.'));
    }
  }
});

/**
 * POST /api/candidates/parse-resume
 * Accepts multipart/form-data PDF (field name: 'resume' or 'file')
 * Extracts text fields for Name, Skills, Experience history, Education details, and Contact information
 */
router.post('/parse-resume', (req, res) => {
  upload.single('resume')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({
        success: false,
        error: uploadErr.message || 'File upload error.'
      });
    }

    try {
      const file = req.file;
      if (!file || !file.buffer) {
        return res.status(400).json({
          success: false,
          error: 'No resume PDF file uploaded. Please attach a valid PDF document.'
        });
      }

      const parsedData = await parseResumeBuffer(file.buffer);

      return res.status(200).json({
        success: true,
        message: 'Resume parsed successfully.',
        parsedData
      });
    } catch (err) {
      console.error('Resume parsing failure:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to parse resume document.'
      });
    }
  });
});

module.exports = router;
