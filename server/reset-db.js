/**
 * Database Reset Utility for Enterprise ATS
 * 
 * Provides controlled data clearance for development and testing.
 * 
 * Usage:
 *   node reset-db.js --jobs-only    # Clears only jobs, applications, timeline history, and uploaded resumes (keeps user accounts)
 *   node reset-db.js --all          # Complete fresh start: clears all users, companies, jobs, applications, notifications, and resumes
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Job = require('./models/job');
const Application = require('./models/application');
const ApplicationStatusHistory = require('./models/applicationStatusHistory');
const ApplicantProfile = require('./models/applicantProfile');
const Notification = require('./models/notification');
const Invitation = require('./models/invitation');
const User = require('./models/user');
const Company = require('./models/company');

const mode = process.argv[2];

if (!mode || (!mode.includes('--jobs-only') && !mode.includes('--all'))) {
  console.log('\n❌ Please specify which data to clear:');
  console.log('   node reset-db.js --jobs-only   -> Deletes all jobs, applications, match data & uploaded resumes (keeps user accounts)');
  console.log('   node reset-db.js --all         -> Complete wipe of entire database & uploaded resumes (start 100% fresh)\n');
  process.exit(1);
}

async function runReset() {
  try {
    console.log('\nConnecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB.\n');

    if (mode === '--jobs-only') {
      console.log('Clearing jobs, applications, timelines, and applicant match records...');
      const deletedJobs = await Job.deleteMany({});
      const deletedApps = await Application.deleteMany({});
      const deletedHistory = await ApplicationStatusHistory.deleteMany({});
      const deletedNotifs = await Notification.deleteMany({});
      
      console.log(`✓ Deleted ${deletedJobs.deletedCount} job postings.`);
      console.log(`✓ Deleted ${deletedApps.deletedCount} candidate applications.`);
      console.log(`✓ Deleted ${deletedHistory.deletedCount} application timeline audit logs.`);
      console.log(`✓ Deleted ${deletedNotifs.deletedCount} notifications.`);
    } else if (mode === '--all') {
      console.log('Performing COMPLETE database wipe...');
      const deletedJobs = await Job.deleteMany({});
      const deletedApps = await Application.deleteMany({});
      const deletedHistory = await ApplicationStatusHistory.deleteMany({});
      const deletedProfiles = await ApplicantProfile.deleteMany({});
      const deletedNotifs = await Notification.deleteMany({});
      const deletedInvites = await Invitation.deleteMany({});
      const deletedUsers = await User.deleteMany({});
      const deletedCompanies = await Company.deleteMany({});

      console.log(`✓ Deleted ${deletedJobs.deletedCount} jobs.`);
      console.log(`✓ Deleted ${deletedApps.deletedCount} applications.`);
      console.log(`✓ Deleted ${deletedHistory.deletedCount} status logs.`);
      console.log(`✓ Deleted ${deletedProfiles.deletedCount} applicant profiles.`);
      console.log(`✓ Deleted ${deletedNotifs.deletedCount} notifications.`);
      console.log(`✓ Deleted ${deletedInvites.deletedCount} team invitations.`);
      console.log(`✓ Deleted ${deletedUsers.deletedCount} users.`);
      console.log(`✓ Deleted ${deletedCompanies.deletedCount} companies.`);
    }

    // Clean up uploaded resume files in server/uploads/
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let removedCount = 0;
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
          removedCount++;
        }
      }
      console.log(`✓ Cleared ${removedCount} uploaded resume files from server/uploads/`);
    }

    console.log('\n🎉 Reset completed successfully! You can now start fresh.\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error during reset:', err.message);
    if (err.name === 'MongooseServerSelectionError') {
      console.error('\n💡 Note: Make sure your current IP address is whitelisted in MongoDB Atlas (Security -> Network Access -> Allow Access From Anywhere 0.0.0.0/0).\n');
    }
    process.exit(1);
  }
}

runReset();
