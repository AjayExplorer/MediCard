const mongoose = require('mongoose');
const DrugInteractionRule = require('../models/DrugInteractionRule');

const drugRules = [
  {
    drugName: 'Propranolol',
    contraindications: [
      {
        condition: 'Asthma',
        severity: 'Critical',
        warning: 'Beta-blockers can cause severe bronchospasm in asthma patients',
        alternativeSuggestion: 'Consider calcium channel blockers instead'
      },
      {
        condition: 'COPD',
        severity: 'Severe',
        warning: 'May worsen respiratory symptoms',
        alternativeSuggestion: 'Use selective beta-1 blockers if necessary'
      }
    ],
    allergyInteractions: []
  },
  {
    drugName: 'Aspirin',
    contraindications: [
      {
        condition: 'Peptic Ulcer Disease',
        severity: 'Severe',
        warning: 'Increased risk of gastrointestinal bleeding',
        alternativeSuggestion: 'Consider acetaminophen for pain relief'
      }
    ],
    allergyInteractions: [
      {
        allergen: 'Salicylates',
        severity: 'Critical',
        warning: 'Can cause severe allergic reaction including anaphylaxis'
      }
    ]
  },
  {
    drugName: 'Metformin',
    contraindications: [
      {
        condition: 'Kidney Disease',
        severity: 'Critical',
        warning: 'Risk of lactic acidosis in patients with reduced kidney function',
        alternativeSuggestion: 'Consider insulin or other diabetes medications'
      }
    ],
    allergyInteractions: []
  },
  {
    drugName: 'Warfarin',
    contraindications: [
      {
        condition: 'Peptic Ulcer Disease',
        severity: 'Critical',
        warning: 'Extremely high risk of life-threatening bleeding',
        alternativeSuggestion: 'Consider newer anticoagulants with lower bleeding risk'
      }
    ],
    allergyInteractions: []
  },
  {
    drugName: 'ACE Inhibitor',
    contraindications: [
      {
        condition: 'Hyperkalemia',
        severity: 'Severe',
        warning: 'Can further increase potassium levels',
        alternativeSuggestion: 'Consider ARBs or calcium channel blockers'
      }
    ],
    allergyInteractions: [
      {
        allergen: 'ACE Inhibitors',
        severity: 'Critical',
        warning: 'Risk of angioedema which can be life-threatening'
      }
    ]
  }
];

const seedDrugRules = async () => {
  try {
    await DrugInteractionRule.deleteMany({});
    await DrugInteractionRule.insertMany(drugRules);
    console.log('Drug interaction rules seeded successfully');
  } catch (error) {
    console.error('Error seeding drug rules:', error);
  }
};

module.exports = seedDrugRules;