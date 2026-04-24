const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, index: true },
  password:  { type: String, required: true, minlength: 6, select: false },
  avatar:    { type: String },
  role:      { type: String, enum: ['user', 'instructor', 'admin'], default: 'user' },
  points:    { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },

  careerGoal: {
    type: String,
    enum: ['Enter in new industry', 'Hobby', 'Advance in your field', 'Self Improvement', null],
    default: null,
  },
  interests: { type: [String], default: [] },
  city:      { type: String, default: '' },
  country:   { type: String, default: '' },
  onboardingCompleted: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (raw) {
  return bcrypt.compare(raw, this.password);
};

module.exports = mongoose.model('User', userSchema);