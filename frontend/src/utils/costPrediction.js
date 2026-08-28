import { api } from '../services/api';
import { vendorCategoryLabels } from '../data/dashboardData';

export const MODEL_ACCURACY = '97.5%';
export const MODEL_NAME = 'Random Forest';

export const COST_TIERS = [
  { id: 'budget', label: 'Budget', hint: 'Under Rs. 500k' },
  { id: 'mid', label: 'Mid-range', hint: 'Rs. 500k – 2M' },
  { id: 'premium', label: 'Premium', hint: 'Rs. 2M – 6M' },
  { id: 'luxury', label: 'Luxury', hint: 'Rs. 6M+' },
];

export const COST_DISTRICTS = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Galle',
  'Matara',
  'Kurunegala',
  'Anuradhapura',
  'Badulla',
  'Ratnapura',
];

export const COST_CATEGORIES = vendorCategoryLabels;

export function predictionFormFromProfile(profile) {
  const guestCount = Number(profile?.guestCount || profile?.guests || profile?.expectedGuests) || 150;
  const district = profile?.district || profile?.city || profile?.venueDistrict || 'Colombo';
  return {
    guest_count: Math.max(50, Math.min(guestCount, 800)),
    category: 'Venue & Res. Halls',
    district,
    per_person_pricing: 1,
    base_unit_price: 6500,
    vendor_rating: 4.5,
    is_spotlight: 0,
    package_complexity: 2,
  };
}

export function formatLkr(value) {
  const amount = Number(value) || 0;
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `Rs. ${millions >= 10 ? Math.round(millions) : millions.toFixed(2)}M`;
  }
  if (amount >= 1000) return `Rs. ${Math.round(amount / 1000)}k`;
  return `Rs. ${amount.toLocaleString('en-LK')}`;
}

export function comparePredictionToBudget(estimatedTotal, budgetTotal) {
  if (!budgetTotal || budgetTotal <= 0) return 'unknown';
  const ratio = estimatedTotal / budgetTotal;
  if (ratio <= 0.85) return 'ok';
  if (ratio <= 1.05) return 'tight';
  return 'over';
}

export async function predictWeddingCost(form) {
  return api.predictCost({
    guest_count: Number(form.guest_count) || 150,
    category: form.category,
    district: form.district,
    per_person_pricing: Number(form.per_person_pricing) ? 1 : 0,
    base_unit_price: Number(form.base_unit_price) || 0,
    vendor_rating: Number(form.vendor_rating) || 4,
    is_spotlight: Number(form.is_spotlight) ? 1 : 0,
    package_complexity: Number(form.package_complexity) || 2,
  });
}
