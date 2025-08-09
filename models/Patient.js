const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
  condition: { type: String, required: true },
  diagnosedDate: { type: Date, required: true },
  severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], required: true },
  notes: String,
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  addedDate: { type: Date, default: Date.now }
});

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  addedDate: { type: Date, default: Date.now }
});

const allergySchema = new mongoose.Schema({
  allergen: { type: String, required: true },
  reaction: { type: String, required: true },
  severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], required: true },
  diagnosedDate: { type: Date, required: true },
  addedDate: { type: Date, default: Date.now }
});

const labReportSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  result: { type: String, required: true },
  normalRange: String,
  testDate: { type: Date, required: true },
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  addedDate: { type: Date, default: Date.now }
});

const patientSchema = new mongoose.Schema({
  medicardId: { 
    type: String, 
    unique: true, 
    required: true,
    default: function() {
      return 'MED' + Date.now() + Math.floor(Math.random() * 1000);
    }
  },
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 
    required: true 
  },
  password: { type: String, required: true },
  
  // Medical Information
  chronicConditions: [medicalHistorySchema],
  allergies: [allergySchema],
  currentMedications: [medicationSchema],
  labReports: [labReportSchema],
  
  // Additional Information
  organDonation: { type: Boolean, default: false },
  lastBloodDonation: Date,
  physicalFitnessStatus: { 
    type: String, 
    enum: ['Excellent', 'Good', 'Fair', 'Poor'], 
    default: 'Good' 
  },
  lastCheckupDate: Date,
  
  // System Information
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Generate unique Medicard ID before saving
patientSchema.pre('save', function(next) {
  if (!this.medicardId) {
    this.medicardId = 'MED' + Date.now() + Math.floor(Math.random() * 1000);
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Patient', patientSchema);