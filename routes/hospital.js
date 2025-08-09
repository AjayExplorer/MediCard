const express = require('express');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const ConsentRequest = require('../models/ConsentRequest');
const DrugInteractionRule = require('../models/DrugInteractionRule');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Search patient by Medicard ID
router.get('/patient/:medicardId', authenticateToken, authorizeRole(['hospital']), async (req, res) => {
  try {
    const { medicardId } = req.params;
    const patient = await Patient.findOne({ medicardId }).select('-password');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request patient record update
router.post('/patient/:medicardId/request-update', authenticateToken, authorizeRole(['hospital']), async (req, res) => {
  try {
    const { medicardId } = req.params;
    const { requestType, requestData, requestMessage } = req.body;
    
    const patient = await Patient.findOne({ medicardId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const consentRequest = new ConsentRequest({
      patientId: patient._id,
      hospitalId: req.user.userId,
      requestType,
      requestData,
      requestMessage
    });

    await consentRequest.save();
    
    res.status(201).json({ message: 'Update request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ADR Check - Check drug interactions
router.post('/adr-check', authenticateToken, authorizeRole(['hospital']), async (req, res) => {
  try {
    const { medicardId, medications } = req.body;
    
    const patient = await Patient.findOne({ medicardId });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const warnings = [];
    
    // Check each medication
    for (const medication of medications) {
      const drugRules = await DrugInteractionRule.findOne({ 
        drugName: { $regex: medication.name, $options: 'i' } 
      });
      
      if (drugRules) {
        // Check against chronic conditions
        for (const condition of patient.chronicConditions) {
          const contraindication = drugRules.contraindications.find(
            c => c.condition.toLowerCase().includes(condition.condition.toLowerCase())
          );
          
          if (contraindication) {
            warnings.push({
              type: 'condition',
              severity: contraindication.severity,
              medication: medication.name,
              condition: condition.condition,
              warning: contraindication.warning,
              alternativeSuggestion: contraindication.alternativeSuggestion
            });
          }
        }
        
        // Check against allergies
        for (const allergy of patient.allergies) {
          const allergyInteraction = drugRules.allergyInteractions.find(
            a => a.allergen.toLowerCase().includes(allergy.allergen.toLowerCase())
          );
          
          if (allergyInteraction) {
            warnings.push({
              type: 'allergy',
              severity: allergyInteraction.severity,
              medication: medication.name,
              allergen: allergy.allergen,
              warning: allergyInteraction.warning
            });
          }
        }
      }
    }
    
    res.json({
      patientId: patient.medicardId,
      patientName: patient.name,
      medicationsChecked: medications,
      warnings,
      safeToAdminister: warnings.length === 0 || warnings.every(w => w.severity === 'Mild')
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get hospital profile
router.get('/profile', authenticateToken, authorizeRole(['hospital']), async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.user.userId).select('-password');
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;