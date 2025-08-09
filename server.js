require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const seedDrugRules = require('./data/seedDrugRules');

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const hospitalRoutes = require('./routes/hospital');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/hospital', hospitalRoutes);

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/patient', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/patient.html'));
});

app.get('/hospital', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/hospital.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Medicard API is running',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Seed drug interaction rules on first run
    await seedDrugRules();
    
    app.listen(PORT, () => {
      console.log(`Medicard server running on port ${PORT}`);
      console.log(`Visit http://localhost:${PORT} to access the application`);
      console.log('MongoDB Connected');
      console.log('Seed drug setup ready');
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', err);
  process.exit(1);
});