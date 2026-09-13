const http = require('http');
const fs = require('fs');
const path = require('path');
const { calculateMatch } = require('./services/matchingService');
const { parseResumeBuffer } = require('./services/resumeParserService');

async function runTests() {
  console.log('=== RUNNING TESTS FOR FEATURE 1 & FEATURE 2 ===\n');

  // TEST 1: Unit Test Resume Parser with actual sample PDF
  console.log('TEST 1: Resume Parser Service with sample PDF...');
  const pdfPath = path.join(__dirname, 'uploads/1789150278938-Resume_SanketSKanse.pdf');
  if (!fs.existsSync(pdfPath)) {
    throw new Error('Sample PDF file not found at: ' + pdfPath);
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  const parsedData = await parseResumeBuffer(pdfBuffer);

  console.log('  -> Name:', parsedData.name);
  console.log('  -> Email:', parsedData.email);
  console.log('  -> Phone:', parsedData.phone);
  console.log('  -> Location:', parsedData.location);
  console.log('  -> Headline:', parsedData.headline);
  console.log('  -> Skills Count:', parsedData.skills.length);
  console.log('  -> Experience Items:', parsedData.experiences.length);
  console.log('  -> Education Items:', parsedData.education.length);

  if (!parsedData.name || !parsedData.email || !parsedData.skills.length) {
    throw new Error('TEST 1 FAILED: Expected parsed fields are missing!');
  }
  console.log('✓ TEST 1 PASSED: Resume Parser successfully extracted all core profile entities.\n');

  // TEST 2: Unit Test Candidate Matching Algorithm
  console.log('TEST 2: Candidate Matching Service Algorithmic Calculation...');
  const testJob = {
    title: 'Senior Full Stack Developer',
    department: 'Engineering',
    location: 'Remote',
    description: 'We are seeking a Senior Full Stack Developer with 2+ years experience in React, Node.js, and MongoDB.',
    requirements: ['React', 'Node.js', 'MongoDB', 'AWS', 'Docker']
  };

  const testProfile = {
    headline: parsedData.headline,
    summary: parsedData.summary,
    skills: parsedData.skills,
    experiences: parsedData.experiences,
    education: parsedData.education
  };

  const matchResult = calculateMatch(testJob, testProfile);
  console.log('  -> Match Score:', matchResult.matchScore + '%');
  console.log('  -> Matching Skills:', matchResult.matchingSkills);
  console.log('  -> Missing Skills:', matchResult.missingSkills);
  console.log('  -> Recommendation Reason:', matchResult.recommendationReason);
  console.log('  -> Score Breakdown:', matchResult.breakdown);

  if (typeof matchResult.matchScore !== 'number' || matchResult.matchScore <= 0 || matchResult.matchScore > 100) {
    throw new Error('TEST 2 FAILED: Invalid matchScore!');
  }
  if (!Array.isArray(matchResult.matchingSkills) || !Array.isArray(matchResult.missingSkills)) {
    throw new Error('TEST 2 FAILED: matchingSkills or missingSkills is not an array!');
  }
  if (!matchResult.recommendationReason || typeof matchResult.recommendationReason !== 'string') {
    throw new Error('TEST 2 FAILED: Missing structured recommendationReason string!');
  }
  console.log('✓ TEST 2 PASSED: Matching calculation produced quantified, explainable output.\n');

  console.log('=== ALL UNIT & INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('TEST SUITE ERROR:', err);
  process.exit(1);
});
