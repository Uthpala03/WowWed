import { normalizeCeremonyType } from '../data/formOptions';
import { vendorCategoryLabels } from '../models/VendorCategory';
import { formatVendorCategories, locationSearchText, vendorCategories, vendorMatchesLocation } from './vendorMeta';

const CEREMONY_RULES = {
  'Church Wedding': {
    prefer: ['church', 'christian', 'chapel', 'cathedral', 'western', 'ballroom', 'reception'],
    avoid: ['kovil', 'nikah', 'mosque', 'mehendi', 'thaali'],
  },
  'Poruwa Ceremony': {
    prefer: ['poruwa', 'kandyan', 'ashtaka', 'jayamangala', 'traditional', 'nilame', 'buddhist', 'magul'],
    avoid: ['nikah', 'mosque', 'kovil', 'mehendi'],
  },
  'Hindu Tamil Wedding': {
    prefer: ['hindu', 'kovil', 'tamil', 'thaali', 'mehendi', 'mangalsutra'],
    avoid: ['nikah', 'mosque', 'church', 'chapel'],
  },
  'Muslim Nikah Ceremony': {
    prefer: ['nikah', 'muslim', 'mosque', 'walima', 'islamic'],
    avoid: ['poruwa', 'church', 'chapel', 'kovil', 'ashtaka'],
  },
  Reception: {
    prefer: ['reception', 'ballroom', 'banquet', 'hotel', 'party'],
    avoid: [],
  },
};

export function parseVendorPriceBounds(vendor) {
  const fromRange = String(vendor?.priceRange || '')
    .split('-')
    .map((part) => Number(String(part).replace(/,/g, '').trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  const fromQuotes = (vendor?.quotations || [])
    .map((q) => Number(String(q.price || '').replace(/,/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0);
  const values = [...fromQuotes, ...fromRange];
  if (!values.length) return { min: 0, max: 0 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

function vendorSearchBlob(vendor) {
  const quotes = (vendor?.quotations || []).flatMap((q) => [q.title, q.details]);
  return [
    vendor?.name,
    vendor?.description,
    formatVendorCategories(vendor),
    locationSearchText(vendor),
    ...quotes,
  ].filter(Boolean).join(' ').toLowerCase();
}

export function vendorMatchesWeddingType(vendor, ceremonyType) {
  const label = normalizeCeremonyType(ceremonyType);
  const rules = CEREMONY_RULES[label] || CEREMONY_RULES['Poruwa Ceremony'];
  const text = vendorSearchBlob(vendor);
  const preferred = rules.prefer.some((key) => text.includes(key));
  const avoided = rules.avoid.some((key) => text.includes(key));
  if (preferred) return { ok: true, explicit: true };
  if (avoided) return { ok: false, explicit: false };
  return { ok: true, explicit: false };
}

export function vendorFitsBudget(vendor, budget) {
  const amount = Number(budget) || 0;
  const { min } = parseVendorPriceBounds(vendor);
  if (!amount) return { ok: true, unknown: true, min };
  if (!min) return { ok: true, unknown: true, min };
  return { ok: min <= amount, unknown: false, min };
}

export function scoreSmartVendor(vendor, { budget, district, ceremonyType }) {
  const districtOk = vendorMatchesLocation(vendor, district);
  const budgetFit = vendorFitsBudget(vendor, budget);
  const weddingFit = vendorMatchesWeddingType(vendor, ceremonyType);
  const hasDistrict = Boolean(district);
  const hasBudget = Number(budget) > 0;
  const hasType = Boolean(ceremonyType);
  const allThree = hasDistrict && districtOk && hasBudget && budgetFit.ok && hasType && weddingFit.ok;

  let score = 0;
  if (districtOk) score += 40;
  if (budgetFit.ok && !budgetFit.unknown) score += 30;
  else if (budgetFit.unknown) score += 8;
  if (weddingFit.explicit) score += 25;
  else if (weddingFit.ok) score += 12;
  score += (Number(vendor.rating) || 4) * 2;
  if (vendor.spotlight) score += 3;

  const budgetAmount = Number(budget) || 0;
  if (budgetAmount && budgetFit.min > 0 && budgetFit.min <= budgetAmount) {
    const share = budgetFit.min / budgetAmount;
    if (share >= 0.05 && share <= 0.45) score += 8;
  }

  return {
    vendor,
    score,
    allThree,
    districtOk,
    budgetOk: budgetFit.ok,
    weddingTypeOk: weddingFit.ok,
    explicitType: weddingFit.explicit,
    startingPrice: budgetFit.min,
    category: primaryCategory(vendor),
  };
}

function primaryCategory(vendor) {
  return vendorCategories(vendor)[0] || 'Other';
}

function isVenueVendor(vendor) {
  return vendorCategories(vendor).some((label) => /venue/i.test(label));
}

export function recommendSmartVendors(vendors, profile, { limit = 24, perCategory = 3, excludeIds = [] } = {}) {
  const district = profile?.district || '';
  const ceremonyType = profile?.ceremonyType || '';
  const budget = Number(profile?.budget) || 0;
  const excluded = new Set(excludeIds.filter(Boolean));

  const ranked = vendors
    .filter((vendor) => !excluded.has(vendor.id))
    .map((vendor) => scoreSmartVendor(vendor, { budget, district, ceremonyType }))
    .filter((row) => {
      if (!row.budgetOk) return false;
      if (isVenueVendor(row.vendor) && district && !row.districtOk) return false;
      if (isVenueVendor(row.vendor) && !row.weddingTypeOk) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score || (b.vendor.rating || 0) - (a.vendor.rating || 0));

  const buckets = new Map(vendorCategoryLabels.map((label) => [label, []]));
  buckets.set('Other', []);
  for (const row of ranked) {
    const key = buckets.has(row.category) ? row.category : 'Other';
    const list = buckets.get(key);
    if (list.length < perCategory) list.push(row);
  }

  const matches = [];
  for (let round = 0; round < perCategory && matches.length < limit; round += 1) {
    for (const label of [...vendorCategoryLabels, 'Other']) {
      const row = buckets.get(label)?.[round];
      if (row) matches.push(row);
      if (matches.length >= limit) break;
    }
  }

  return {
    district,
    ceremonyType,
    budget,
    matches,
    totalMatches: ranked.length,
  };
}

export function bookingForVendor(bookings, vendor) {
  if (!vendor) return null;
  const listingId = vendor.id || vendor.listingId;
  const vendorName = String(vendor.name || vendor.businessName || '').trim().toLowerCase();
  const list = bookings || [];
  const byListing = listingId
    ? list.find((booking) => booking.vendorListingId && booking.vendorListingId === listingId)
    : null;
  if (byListing) return byListing;
  if (!vendorName) return null;
  return list.find((booking) => (
    String(booking.vendorName || '').trim().toLowerCase() === vendorName
  )) || null;
}
