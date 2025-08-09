const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');

const router = express.Router();

// Patient Registration
router.post('/patient/register', async (req, res) => {
  try {
    const { name, email, contactNumber, dateOfBirth, gender, weight, height, bloodGroup, password, organDonation } = req.body;

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ message: 'Patient with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create patient
    const patient = new Patient({
      name,
      email,
      contactNumber,
      dateOfBirth,
      gender,
      weight,
      height,
      bloodGroup,
      password: hashedPassword,
      organDonation: organDonation || false
    });

    await patient.save();

    res.status(201).json({ 
      message: 'Patient registered successfully', 
      medicardId: patient.medicardId 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Hospital Registration
router.post('/hospital/register', async (req, res) => {
  try {
    const { hospitalName, ninNumber, password, address, contactNumber, email, licenseNumber, specialties } = req.body;

    // Check if hospital already exists
    const existingHospital = await Hospital.findOne({ $or: [{ ninNumber }, { email }] });
    if (existingHospital) {
      return res.status(400).json({ message: 'Hospital with this NIN or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create hospital
    const hospital = new Hospital({
      hospitalName,
      ninNumber,
      password: hashedPassword,
      address,
      contactNumber,
      email,
      licenseNumber,
      specialties
    });

    await hospital.save();

    res.status(201).json({ message: 'Hospital registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Patient Login
router.post('/patient/login', async (req, res) => {
  try {
    const { medicardId, password } = req.body;

    // Find patient
    const patient = await Patient.findOne({ medicardId });
    if (!patient) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: patient._id, role: 'patient', medicardId: patient.medicardId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: patient._id, 
        name: patient.name, 
        medicardId: patient.medicardId,
        role: 'patient'
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Hospital Login
router.post('/hospital/login', async (req, res) => {
  try {
    const { ninNumber, password } = req.body;

    // Find hospital
    const hospital = await Hospital.findOne({ ninNumber });
    if (!hospital) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, hospital.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: hospital._id, role: 'hospital', hospitalName: hospital.hospitalName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: hospital._id, 
        hospitalName: hospital.hospitalName, 
        ninNumber: hospital.ninNumber,
        role: 'hospital'
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;