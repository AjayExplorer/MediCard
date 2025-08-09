const mongoose = require('mongoose');

const drugInteractionRuleSchema = new mongoose.Schema({
  drugName: { type: String, required: true },
  contraindications: [{
    condition: { type: String, required: true },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe', 'Critical'], required: true },
    warning: { type: String, required: true },
    alternativeSuggestion: String
  }],
  allergyInteractions: [{
    allergen: { type: String, required: true },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe', 'Critical'], required: true },
    warning: { type: String, required: true }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DrugInteractionRule', drugInteractionRuleSchema);