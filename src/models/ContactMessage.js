const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  firstName: String,
  lastName:  String,
  email:     { type: String, required: true },
  subject:   String,
  message:   { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);