import { api } from '../services/api';
import { districts } from '../data/formOptions';

export const MODEL_ACCURACY = {
  r2: 0.9066,
  percent: '90.66%',
  mae: 759387,
  rmse: 1241231,
};

export const MODEL_INFO = {
  id: 'ML-1',
  module: 'M06',
  name: 'Wedding Cost Prediction',
  type: 'Supervised Learning',
  algorithm: 'Random Forest Regression',
  trees: 200,
  why: 'Estimates a total from guests, district, ceremony, scale, and season.',
  dataset: 'Sri Lankan wedding records',
  output: 'Estimated total wedding cost in LKR plus a 95% confidence interval',
  file: 'RandomForestRegression.pkl',
  linked: 'Budget Management (M05)',
  featureImportance: [
    { key: 'scale', label: 'Wedding scale', weight: 70.7 },
    { key: 'guests', label: 'Guest count', weight: 24.7 },
    { key: 'district', label: 'Venue district', weight: 2.0 },
    { key: 'season', label: 'Season', weight: 1.4 },
    { key: 'ceremony', label: 'Ceremony type', weight: 1.1 },
  ],
};

export const COST_DISTRICTS = [...districts];

export const COST_CEREMONIES = [
  { value: 'Poruwa', label: 'Poruwa ceremony' },
  { value: 'Buddhist', label: 'Buddhist' },
  { value: 'Hindu', label: 'Hindu / Tamil wedding' },
  { value: 'Christian', label: 'Church wedding' },
  { value: 'Islamic', label: 'Muslim Nikah' },
];

export const COST_SCALES = [
  { value: 'budget', label: 'Budget', hint: 'Simple' },
  { value: 'standard', label: 'Standard', hint: 'Typical' },
  { value: 'premium', label: 'Premium', hint: 'Grand' },
];

const PEAK_MONTHS = [0, 3, 6, 7, 11];

export function isPeakWeddingMonth(dateValue) {
  if (!dateValue) return false;
  const month = new Date(dateValue).getMonth();
  return Number.isFinite(month) && PEAK_MONTHS.includes(month);
}

export function scaleFromBudget(amount) {
  const n = Number(amount) || 0;
  if (n >= 6000000) return 'premium';
  if (n >= 2500000) return 'standard';
  if (n > 0) return 'budget';
  return 'standard';
}

export function predictionFormFromProfile(profile, extras = {}) {
  const ceremony = String(profile?.ceremonyType || extras.ceremonyType || '').toLowerCase();
  let ceremonyType = 'Poruwa';
  if (ceremony.includes('hindu') || ceremony.includes('tamil')) ceremonyType = 'Hindu';
  else if (ceremony.includes('church') || ceremony.includes('christian')) ceremonyType = 'Christian';
  else if (ceremony.includes('muslim') || ceremony.includes('islam') || ceremony.includes('nikah')) ceremonyType = 'Islamic';
  else if (ceremony.includes('buddhist')) ceremonyType = 'Buddhist';
  else if (ceremony.includes('poruwa')) ceremonyType = 'Poruwa';

  const savedBudget = Number(profile?.budget) || Number(extras.budgetTotal) || 0;
  let scale = String(profile?.scale || extras.scale || '').toLowerCase();
  if (scale === 'luxury') scale = 'premium';
  if (!['budget', 'standard', 'premium'].includes(scale)) {
    scale = savedBudget ? scaleFromBudget(savedBudget) : 'standard';
  }

  const rawDistrict = profile?.district || extras.district || 'Colombo';
  const district = COST_DISTRICTS.includes(rawDistrict) ? rawDistrict : 'Colombo';
  const guestCount = Number(profile?.guestCount) || Number(extras.guestListCount) || 150;

  return {
    guestCount,
    district,
    ceremonyType,
    scale,
    seasonal: isPeakWeddingMonth(profile?.weddingDate || extras.weddingDate) ? 1 : 0,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function predictWeddingCost(form) {
  const payload = {
    guestCount: Number(form?.guestCount) || 150,
    district: form?.district || 'Colombo',
    ceremonyType: form?.ceremonyType || 'Poruwa',
    scale: form?.scale || 'standard',
    weddingDate: form?.weddingDate || '',
    seasonal: Number(form?.seasonal) ? 1 : 0,
  };

  let lastError = 'The cost model is starting. Please try again in a moment.';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await api.predictCost(payload);
      if (result?.estimate) {
        return {
          ...result,
          source: result.source || 'RandomForestRegression.pkl',
          metrics: result.metrics || MODEL_ACCURACY,
        };
      }
      lastError = result?.error || lastError;
    } catch (err) {
      lastError = err.message || lastError;
    }
    if (attempt === 0) await sleep(600);
  }

  throw new Error(lastError);
}
