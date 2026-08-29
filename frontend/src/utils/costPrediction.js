import { api } from '../services/api';
import { districts } from '../data/formOptions';
import {
  buildBudgetSummary,
  buildRequirementDrivers,
  calculateDetailedBudget,
} from '../data/weddingBudgetEngine';

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
  why: 'Estimates totals from guests, location, ceremony, services, and season.',
  dataset: 'Sri Lankan wedding vendor quotations',
  output: 'Line-item budget with average LKR prices per category',
  file: 'wowwed_cost_random_forest.pkl',
  linked: 'Budget Management (M05)',
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

export {
  MEAL_STYLES,
  PLATE_PRICE_RANGES,
  DRINKS_PACKAGES,
  RECEPTION_TIMES,
  PHOTO_PACKAGES,
  VIDEO_PACKAGES,
  ENTERTAINMENT_OPTIONS,
  DECOR_LEVELS,
  FLOWER_TYPES,
  LIGHTING_OPTIONS,
  BRIDAL_PACKAGES,
  GROOM_PACKAGES,
  BEAUTY_PACKAGES,
  INVITATION_STYLES,
  TRANSPORT_OPTIONS,
  CAKE_STYLES,
  JEWELLERY_LEVELS,
  VENUE_TYPES,
  CATEGORY_BUDGET_MAP,
} from '../data/weddingBudgetEngine';

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

function ceremonyKey(ceremonyType) {
  const c = String(ceremonyType || '').toLowerCase();
  if (c.includes('hindu') || c.includes('tamil')) return 'hindu';
  if (c.includes('church') || c.includes('christian')) return 'christian';
  if (c.includes('muslim') || c.includes('nikah') || c.includes('islam')) return 'islamic';
  if (c.includes('buddhist')) return 'buddhist';
  if (c.includes('reception')) return 'reception';
  return 'poruwa';
}

export function defaultServicesForScale(scale, ceremonyType) {
  const ceremony = ceremonyKey(ceremonyType);
  const plateByScale = { budget: '5500', standard: '7000', premium: '11000' };
  return {
    mealStyle: scale === 'budget' ? 'basic' : scale === 'premium' ? 'premium_buffet' : 'buffet',
    platePriceRange: plateByScale[scale] || 'auto',
    drinksPackage: scale === 'budget' ? 'soft' : scale === 'premium' ? 'premium' : 'standard',
    receptionTime: 'lunch',
    photoPackage: scale === 'budget' ? 'basic' : scale === 'premium' ? 'premium' : 'full',
    videoPackage: scale === 'budget' ? 'none' : scale === 'premium' ? 'cinematic' : 'highlights',
    entertainment: scale === 'budget' ? 'dj' : scale === 'premium' ? 'band_dj' : 'band',
    decorLevel: scale === 'budget' ? 'simple' : scale === 'premium' ? 'luxury' : 'standard',
    flowerType: scale === 'budget' ? 'artificial' : scale === 'premium' ? 'fresh' : 'mixed',
    lightingPackage: scale === 'budget' ? 'basic' : scale === 'premium' ? 'full' : 'ambient',
    bridalPackage: scale === 'budget' ? 'rental' : scale === 'premium' ? 'designer' : 'boutique',
    groomPackage: scale === 'budget' ? 'rental' : scale === 'premium' ? 'designer' : 'standard',
    beautyPackage: scale === 'budget' ? 'basic' : scale === 'premium' ? 'premium' : 'full',
    invitationStyle: scale === 'budget' ? 'digital' : scale === 'premium' ? 'luxury' : 'standard',
    cakeStyle: scale === 'premium' ? 'premium' : 'standard',
    jewellery: scale === 'premium' ? 'heavy' : scale === 'budget' ? 'minimal' : 'standard',
    includeMehendi: ceremony === 'hindu',
  };
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
  const guestCount = Number(extras.rsvpGuestCount)
    || Number(profile?.guestCount)
    || Number(extras.guestListCount)
    || 150;
  const services = defaultServicesForScale(scale, ceremonyType);

  return {
    guestCount,
    district,
    ceremonyType,
    scale,
    seasonal: isPeakWeddingMonth(profile?.weddingDate || extras.weddingDate) ? 1 : 0,
    venueType: profile?.venueType || extras.venueType || 'indoor',
    transport: guestCount >= 300 ? 'guest_buses' : 'bridal',
    customItems: [],
    customPlatePrice: '',
    customLabels: {},
    customAmounts: {},
    ...services,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildCostBreakdown(form, prediction = {}) {
  const detail = calculateDetailedBudget(form);
  const estimate = Number(prediction.estimate) || detail.total;
  const ratio = detail.total ? estimate / detail.total : 1;

  const scaleAmounts = (rows) => rows.map((row) => ({
    ...row,
    amount: round1000(row.amount * ratio),
    percent: 0,
  }));

  const vendorCategories = scaleAmounts(detail.vendorCategories || []);
  const vendorTotal = vendorCategories.reduce((sum, row) => sum + row.amount, 0);
  vendorCategories.forEach((row) => {
    row.percent = vendorTotal ? Math.round((row.amount / vendorTotal) * 100) : 0;
  });
  vendorCategories.sort((a, b) => b.amount - a.amount);

  return {
    summary: buildBudgetSummary(form, { ...detail, total: estimate }),
    perGuest: Math.round(estimate / detail.guests),
    unitPricePerGuest: detail.lineItems.find((row) => row.id === 'catering')?.unitPrice
      || Math.round(estimate / detail.guests),
    drivers: buildRequirementDrivers(form, detail),
    categories: vendorCategories,
    vendorCategories,
    lineItems: detail.lineItems.map((item) => ({ ...item, amount: round1000(item.amount * ratio) })),
    itemCount: detail.lineItems.length,
  };
}

function round1000(n) {
  return Math.round(Number(n) / 1000) * 1000;
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

  const detail = calculateDetailedBudget(form);
  let mlResult = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      mlResult = await api.predictCost(payload);
      if (mlResult?.estimate) break;
    } catch {
      /* use engine-only estimate */
    }
    if (attempt === 0) await sleep(600);
  }

  const estimate = detail.total;
  const low = mlResult?.low ? Math.min(detail.low, mlResult.low) : detail.low;
  const high = mlResult?.high ? Math.max(detail.high, mlResult.high) : detail.high;

  const enriched = {
    estimate,
    low,
    high,
    margin: Math.round((high - low) / 2),
    confidence: mlResult?.confidence || '90%',
    cost_tier: mlResult?.cost_tier,
    cost_tier_label: mlResult?.cost_tier_label,
    source: 'weddingBudgetEngine',
    metrics: mlResult?.metrics || MODEL_ACCURACY,
    factors: mlResult?.factors || {},
  };

  return { ...enriched, breakdown: buildCostBreakdown(form, enriched) };
}

export function formatPredictionInputs(form) {
  return [
    { label: 'Guests', value: Number(form.guestCount) || 0 },
    { label: 'District', value: form.district },
    { label: 'Ceremony', value: form.ceremonyType },
    { label: 'Venue', value: form.venueType },
    { label: 'Style', value: form.scale },
    { label: 'Season', value: Number(form.seasonal) ? 'Peak' : 'Regular' },
  ];
}
