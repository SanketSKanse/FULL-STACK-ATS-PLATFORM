/**
 * Password Reset Utility for Enterprise ATS
 * 
 * Allows resetting the password of any user account in MongoDB Atlas.
 * Passwords in the database are hashed with bcrypt for security and cannot be decrypted,
 * but this script allows setting a new known password immediately.
 * 
 * Usage:
 *   node reset-password.js <email> <newPassword>
 * 
 * Example:
 *   node reset-password.js sanketkanse0009@gmail.com myNewPassword123
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/user');

const targetEmail = process.argv[2];
const newPassword = process.argv[3];

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    if (!targetEmail || !newPassword) {
      console.log('\n❌ Usage: node reset-password.js <email> <newPassword>');
      console.log('\n📋 Here are the active user accounts in your database:');
      
      const allUsers = await User.find({}, 'name email role').sort({ createdAt: -1 });
      allUsers.forEach(u => {
        console.log(`   • ${u.email.padEnd(35)} [${u.role.toUpperCase()}] (${u.name})`);
      });

      console.log('\n👉 Example:');
      console.log('   node reset-password.js sanketkanse0009@gmail.com password123\n');
      process.exit(1);
    }

    const emailClean = targetEmail.toLowerCase().trim();
    const user = await User.findOne({ email: emailClean });

    if (!user) {
      console.log(`\n❌ No account found with email: "${emailClean}"`);
      console.log('\nAvailable accounts:');
      const allUsers = await User.find({}, 'email role');
      allUsers.forEach(u => console.log(`   • ${u.email} (${u.role})`));
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log('\n✅ Password updated successfully!');
    console.log(`   • User:     ${user.name}`);
    console.log(`   • Email:    ${user.email}`);
    console.log(`   • Role:     ${user.role}`);
    console.log(`   • New Pass: ${newPassword}`);
    console.log('\nYou can now log in immediately with this email and new password.\n');

    process.exit(0);
  } catch (err) {
    console.error('Error resetting password:', err.message);
    process.exit(1);
  }
}

main();
