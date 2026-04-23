// const mongoose = require('mongoose');

// const notificationSchema = new mongoose.Schema({
//   user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
//   type:        { type: String, enum: ['course_upload','resume','coupon','discount','system'], required: true },
//   title:       String,
//   description: String,
//   icon:        String,
//   isRead:      { type: Boolean, default: false },
// }, { timestamps: true });

// module.exports = mongoose.model('Notification', notificationSchema);

const mongoose = require('mongoose');

module.exports = mongoose.model('Notification', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  type: {
    type: String,
    enum: ['course_upload', 'resume', 'coupon', 'discount', 'system'],
    required: true
  },

  title: String,
  description: String,
  icon: String,

  // ✅ NEW (optional)
  link: String, // e.g. "/learn/course/ID" or "/my-learning"
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // optional

  isRead: { type: Boolean, default: false },
}, { timestamps: true }));
