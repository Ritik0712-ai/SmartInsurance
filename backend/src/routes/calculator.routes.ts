import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Base premium rates per 1000 sum assured (per year)
const BASE_RATES: Record<string, number> = {
  'LIFE': 15,
  'HEALTH': 25,
  'VEHICLE': 20,
  'HOME': 10,
  'TRAVEL': 5,
  'TERM': 8,
};

// Age adjustment factors
const AGE_FACTORS: Record<string, number> = {
  '18-25': 0.8,
  '26-35': 1.0,
  '36-45': 1.2,
  '46-55': 1.5,
  '56-65': 2.0,
  '65+': 2.5,
};

// Occupation risk factors
const OCCUPATION_FACTORS: Record<string, number> = {
  'OFFICE': 1.0,
  'LABOR': 1.3,
  'PROFESSIONAL': 1.1,
  'BUSINESS': 1.0,
  'RETIRED': 1.2,
  'STUDENT': 0.9,
};

// Calculate premium
router.post('/calculate', async (req, res) => {
  try {
    const {
      policyType,
      sumAssured,
      tenureYears,
      age,
      occupation,
      gender,
      smokingStatus,
      coverageType,
    } = req.body;

    // Validation
    if (!policyType || !sumAssured || !tenureYears || !age) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: policyType, sumAssured, tenureYears, age',
      });
      return;
    }

    // Get base rate
    const baseRate = BASE_RATES[policyType.toUpperCase()] || 15;

    // Calculate age factor
    let ageGroup = '36-45';
    if (age >= 18 && age <= 25) ageGroup = '18-25';
    else if (age >= 26 && age <= 35) ageGroup = '26-35';
    else if (age >= 46 && age <= 55) ageGroup = '46-55';
    else if (age >= 56 && age <= 65) ageGroup = '56-65';
    else if (age > 65) ageGroup = '65+';

    const ageFactor = AGE_FACTORS[ageGroup];

    // Get occupation factor
    const occupationFactor = OCCUPATION_FACTORS[occupation?.toUpperCase()] || 1.0;

    // Gender factor (men typically pay slightly more)
    const genderFactor = gender?.toUpperCase() === 'MALE' ? 1.1 : 1.0;

    // Smoking factor
    const smokingFactor = smokingStatus?.toLowerCase() === 'yes' || smokingStatus === 'SMOKER' ? 1.5 : 1.0;

    // Coverage type factor
    const coverageFactor = coverageType === 'COMPREHENSIVE' ? 1.0 : coverageType === 'BASIC' ? 0.8 : 1.0;

    // Calculate annual premium
    const basePremium = (sumAssured / 1000) * baseRate;
    const totalFactor = ageFactor * occupationFactor * genderFactor * smokingFactor * coverageFactor;
    const annualPremium = basePremium * totalFactor;

    // Calculate frequency premiums
    const monthlyPremium = annualPremium / 12;
    const quarterlyPremium = annualPremium / 4;
    const halfYearlyPremium = annualPremium / 2;

    // Calculate total premium over tenure
    const totalPremiumOverTenure = annualPremium * tenureYears;

    // Calculate total sum assured (in case of term insurance with return of premium)
    const totalBenefits = sumAssured + (totalPremiumOverTenure * 0.3); // Estimated bonus/returns

    // Get tenure discounts
    const tenureDiscount = tenureYears >= 5 ? 0.1 : tenureYears >= 3 ? 0.05 : 0;

    res.json({
      success: true,
      data: {
        calculation: {
          baseRate,
          ageGroup,
          ageFactor,
          occupationFactor,
          genderFactor,
          smokingFactor,
          coverageFactor,
          tenureDiscount,
          totalFactor: parseFloat(totalFactor.toFixed(2)),
        },
        premium: {
          annual: parseFloat(annualPremium.toFixed(2)),
          monthly: parseFloat(monthlyPremium.toFixed(2)),
          quarterly: parseFloat(quarterlyPremium.toFixed(2)),
          halfYearly: parseFloat(halfYearlyPremium.toFixed(2)),
          afterDiscount: parseFloat((annualPremium * (1 - tenureDiscount)).toFixed(2)),
        },
        summary: {
          sumAssured: parseFloat(sumAssured),
          tenureYears,
          age,
          policyType,
          totalPremiumOverTenure: parseFloat((totalPremiumOverTenure * (1 - tenureDiscount)).toFixed(2)),
          totalBenefits: parseFloat(totalBenefits.toFixed(2)),
          coverageAmount: parseFloat(sumAssured),
        },
        comparisons: {
          monthlyPremium: parseFloat(monthlyPremium.toFixed(2)),
          yearlyPremium: parseFloat(annualPremium.toFixed(2)),
          oneTimePremium: parseFloat((annualPremium * tenureYears * 0.9).toFixed(2)), // 10% discount for one-time
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get policy type info
router.get('/policy-types', (req, res) => {
  const policyTypes = [
    {
      id: 'LIFE',
      name: 'Life Insurance',
      description: 'Financial protection for your family in case of unfortunate events',
      coverage: 'Death benefit, maturity benefit, accidental death rider',
      minSumAssured: 500000,
      maxSumAssured: 100000000,
      minTenure: 5,
      maxTenure: 40,
    },
    {
      id: 'HEALTH',
      name: 'Health Insurance',
      description: 'Comprehensive health coverage for medical expenses',
      coverage: 'Hospitalization, daycare procedures, pre-post hospitalization',
      minSumAssured: 300000,
      maxSumAssured: 50000000,
      minTenure: 1,
      maxTenure: 3,
    },
    {
      id: 'VEHICLE',
      name: 'Vehicle Insurance',
      description: 'Protect your vehicle against damages and theft',
      coverage: 'Own damage, third party liability, personal accident',
      minSumAssured: 50000,
      maxSumAssured: 5000000,
      minTenure: 1,
      maxTenure: 3,
    },
    {
      id: 'HOME',
      name: 'Home Insurance',
      description: 'Secure your home and belongings',
      coverage: 'Structure, content, liability, alternative accommodation',
      minSumAssured: 1000000,
      maxSumAssured: 100000000,
      minTenure: 1,
      maxTenure: 5,
    },
    {
      id: 'TRAVEL',
      name: 'Travel Insurance',
      description: 'International and domestic travel coverage',
      coverage: 'Medical emergency, trip cancellation, lost baggage',
      minSumAssured: 50000,
      maxSumAssured: 10000000,
      minTenure: 1,
      maxTenure: 1,
    },
    {
      id: 'TERM',
      name: 'Term Insurance',
      description: 'Pure protection life insurance at affordable rates',
      coverage: 'Death benefit only, no maturity benefit',
      minSumAssured: 2500000,
      maxSumAssured: 100000000,
      minTenure: 5,
      maxTenure: 50,
    },
  ];

  res.json({
    success: true,
    data: policyTypes,
  });
});

// Get occupation list
router.get('/occupations', (req, res) => {
  const occupations = [
    { id: 'OFFICE', name: 'Office Job', riskLevel: 'Low' },
    { id: 'PROFESSIONAL', name: 'Professional (Doctor, Lawyer, Engineer)', riskLevel: 'Low' },
    { id: 'BUSINESS', name: 'Business Owner', riskLevel: 'Medium' },
    { id: 'LABOR', name: 'Manual Laborer', riskLevel: 'High' },
    { id: 'RETIRED', name: 'Retired', riskLevel: 'Low' },
    { id: 'STUDENT', name: 'Student', riskLevel: 'Low' },
  ];

  res.json({
    success: true,
    data: occupations,
  });
});

export default router;
