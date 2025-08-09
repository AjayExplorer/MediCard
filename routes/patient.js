const express = require('express');
const Patient = require('../models/Patient');
const ConsentRequest = require('../models/ConsentRequest');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get patient profile
router.get('/profile', authenticateToken, authorizeRole(['patient']), async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.userId).select('-password');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get consent requests
router.get('/consent-requests', authenticateToken, authorizeRole(['patient']), async (req, res) => {
  try {
    const requests = await ConsentRequest.find({ 
      patientId: req.user.userId,
      status: 'pending'
    }).populate('hospitalId', 'hospitalName').sort({ requestedAt: -1 });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Respond to consent request
router.post('/consent-requests/:requestId/respond', authenticateToken, authorizeRole(['patient']), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, responseMessage } = req.body;

    const request = await ConsentRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Consent request not found' });
    }

    if (request.patientId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    request.status = status;
    request.responseMessage = responseMessage;
    request.respondedAt = new Date();
    await request.save();

    // If approved, update patient record
    if (status === 'approved') {
      const patient = await Patient.findById(req.user.userId);
      
      switch (request.requestType) {
        case 'addCondition':
          patient.chronicConditions.push(request.requestData);
          break;
        case 'addMedication':
          patient.currentMedications.push(request.requestData);
          break;
        case 'addAllergy':
          patient.allergies.push(request.requestData);
          break;
        case 'addLabReport':
          patient.labReports.push(request.requestData);
          break;
        case 'updateInfo':
          Object.assign(patient, request.requestData);
          break;
      }
      
      await patient.save();
    }

    res.json({ message: 'Consent request processed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update patient info
router.put('/profile', authenticateToken, authorizeRole(['patient']), async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Prevent password update through this route
    delete updates.medicardId; // Prevent medicardId change
    
    const patient = await Patient.findByIdAndUpdate(
      req.user.userId,
      { ...updates, lastUpdated: new Date() },
      { new: true }
    ).select('-password');
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;