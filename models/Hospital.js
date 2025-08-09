const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  hospitalName: { type: String, required: true },
  ninNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  licenseNumber: { type: String, required: true },
  specialties: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hospital', hospitalSchema);