require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const User = require('../models/User');
const Course = require('../models/Course');
const Certificate = require('../models/Certificate');

// === EDIT THIS to your login email ===
const TARGET_EMAIL = 'seyframadhanbch@gmail.com';
// =====================================

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('No MONGO_URI in .env');

  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB');

  // 1. Find the user
  const user = await User.findOne({ email: TARGET_EMAIL });
  if (!user) throw new Error(`User not found: ${TARGET_EMAIL}`);
  console.log(`✓ Found user: ${user.firstName} ${user.lastName} (${user.email})`);

  // 2. Find any published course
  const course = await Course.findOne({ isPublished: { $ne: false } });
  if (!course) throw new Error('No course found in database');
  console.log(`✓ Found course: ${course.title}`);

  // 3. Check if a certificate for this user+course already exists
  const existing = await Certificate.findOne({ user: user._id, course: course._id });
  if (existing) {
    console.log(`! Certificate already exists for this user+course: ${existing.code}`);
    console.log(`  → Open: http://localhost:5173/certificates/${existing._id}`);
    process.exit(0);
  }

  // 4. Create certificate
  const code = 'EDU-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  const cert = await Certificate.create({
    user: user._id,
    course: course._id,
    code,
    issuedAt: new Date(),
  });

  console.log('\n🎉 Certificate created!');
  console.log(`   ID:     ${cert._id}`);
  console.log(`   Code:   ${cert.code}`);
  console.log(`   Course: ${course.title}`);
  console.log(`\n   → Visit: http://localhost:5173/certificates`);
  console.log(`   → Direct: http://localhost:5173/certificates/${cert._id}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});