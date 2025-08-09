const mongoose = require('mongoose');

const consentRequestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  requestType: { 
    type: String, 
    enum: ['addCondition', 'addMedication', 'addAllergy', 'addLabReport', 'updateInfo'], 
    required: true 
  },
  requestData: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  requestMessage: String,
  responseMessage: String,
  requestedAt: { type: Date, default: Date.now },
  respondedAt: Date,
  expiresAt: { 
    type: Date, 
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
  }
});

module.exports = mongoose.model('ConsentRequest', consentRequestSchema);