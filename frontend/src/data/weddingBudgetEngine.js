/**
 * Sri Lankan wedding budget engine — average vendor prices by requirement.
 * Amounts in LKR; tuned to WowWed vendor dataset tiers (budget / standard / premium).
 */

const DISTRICT_TIER = {
  Colombo: 3, Gampaha: 2, Kalutara: 2, Kandy: 2, Kegalle: 2,
  Galle: 2, Matara: 1, Kurunegala: 1, Anuradhapura: 1, Badulla: 1,
  Ratnapura: 1, Trincomalee: 1, Jaffna: 1, Batticaloa: 1, Ampara: 1,
  Hambantota: 1, Puttalam: 1, Polonnaruwa: 1, Mannar: 1, Vavuniya: 1,
  Matale: 2, Monaragala: 1, Mullaitivu: 1, Kilinochchi: 1, 'Nuwara Eliya': 2,
};

const SCALE_KEY = { budget: 'budget', standard: 'standard', premium: 'premium', luxury: 'premium' };

export const MEAL_STYLES = [
  { value: 'basic', label: 'Basic rice & curry', hint: 'From ~Rs. 4,000/guest' },
  { value: 'buffet', label: 'Buffet spread', hint: 'From ~Rs. 7,000/guest' },
  { value: 'premium_buffet', label: 'Premium buffet + live stations', hint: 'From ~Rs. 11,000/guest' },
];

export const PLATE_PRICE_RANGES = [
  { value: 'auto', label: 'Match meal package', hint: 'Uses meal style rates' },
  { value: '4000', label: 'Rs. 3,500 – 4,500 / plate', hint: 'Home / small hall catering' },
  { value: '5500', label: 'Rs. 5,000 – 6,000 / plate', hint: 'Sunday / Poya hotel menus' },
  { value: '7000', label: 'Rs. 6,500 – 7,500 / plate', hint: 'Standard banquet buffet' },
  { value: '8500', label: 'Rs. 8,000 – 9,000 / plate', hint: 'Hotel buffet (dataset avg)' },
  { value: '11000', label: 'Rs. 10,000 – 12,000 / plate', hint: 'Premium hotel buffet' },
  { value: '13500', label: 'Rs. 12,500+ / plate', hint: '5-star wedding menus' },
  { value: 'custom', label: 'Custom plate price', hint: 'Enter your own per-plate rate' },
];

export const DRINKS_PACKAGES = [
  { value: 'none', label: 'No drinks package', hint: 'Arrange separately' },
  { value: 'soft', label: 'Soft drinks & juices', hint: '~Rs. 450/guest' },
  { value: 'standard', label: 'Soft drinks + beer', hint: '~Rs. 850/guest' },
  { value: 'premium', label: 'Full bar selection', hint: '~Rs. 1,800/guest' },
];

export const RECEPTION_TIMES = [
  { value: 'lunch', label: 'Lunch reception', hint: 'Day wedding' },
  { value: 'dinner', label: 'Dinner reception', hint: 'Evening wedding' },
  { value: 'both', label: 'Lunch + dinner events', hint: 'Two receptions' },
];

export const PHOTO_PACKAGES = [
  { value: 'basic', label: 'Basic (6 hrs, 1 photographer)', hint: 'From ~Rs. 75,000' },
  { value: 'full', label: 'Full day (2 photographers)', hint: 'From ~Rs. 150,000' },
  { value: 'premium', label: 'Premium + pre-shoot', hint: 'From ~Rs. 350,000' },
];

export const VIDEO_PACKAGES = [
  { value: 'none', label: 'No videography', hint: 'Rs. 0' },
  { value: 'highlights', label: 'Highlights reel', hint: 'From ~Rs. 75,000' },
  { value: 'cinematic', label: 'Cinematic full day', hint: 'From ~Rs. 200,000' },
];

export const ENTERTAINMENT_OPTIONS = [
  { value: 'none', label: 'No live entertainment', hint: 'Sound system only' },
  { value: 'dj', label: 'DJ', hint: 'From ~Rs. 55,000' },
  { value: 'band', label: 'Live band', hint: 'From ~Rs. 150,000' },
  { value: 'band_dj', label: 'Band + DJ', hint: 'From ~Rs. 220,000' },
];

export const DECOR_LEVELS = [
  { value: 'simple', label: 'Simple', hint: 'Basic draping & minimal florals' },
  { value: 'standard', label: 'Standard', hint: 'Stage, entrance & table décor' },
  { value: 'luxury', label: 'Luxury', hint: 'Full custom design + lighting' },
];

export const FLOWER_TYPES = [
  { value: 'fresh', label: 'Fresh flowers', hint: 'Full floral cost' },
  { value: 'artificial', label: 'Artificial flowers', hint: '~55% savings vs fresh' },
  { value: 'mixed', label: 'Mixed fresh + artificial', hint: '~30% savings vs fresh' },
];

export const LIGHTING_OPTIONS = [
  { value: 'basic', label: 'Basic hall lighting', hint: 'Included with venue' },
  { value: 'ambient', label: 'Ambient uplighting', hint: 'Stage & entrance' },
  { value: 'full', label: 'Full lighting design', hint: 'Stage, tables & dance floor' },
];

export const BRIDAL_PACKAGES = [
  { value: 'rental', label: 'Rental saree / gown', hint: 'From ~Rs. 45,000' },
  { value: 'boutique', label: 'Boutique purchase', hint: 'From ~Rs. 120,000' },
  { value: 'designer', label: 'Designer / custom', hint: 'From ~Rs. 250,000' },
];

export const GROOM_PACKAGES = [
  { value: 'rental', label: 'Rental suit / national dress', hint: 'From ~Rs. 25,000' },
  { value: 'standard', label: 'Standard purchase', hint: 'From ~Rs. 75,000' },
  { value: 'designer', label: 'Designer outfit', hint: 'From ~Rs. 150,000' },
];

export const BEAUTY_PACKAGES = [
  { value: 'basic', label: 'Hair & makeup (bride only)', hint: 'From ~Rs. 25,000' },
  { value: 'full', label: 'Full bridal + trial', hint: 'From ~Rs. 55,000' },
  { value: 'premium', label: 'Premium team + bridesmaids', hint: 'From ~Rs. 100,000' },
];

export const INVITATION_STYLES = [
  { value: 'digital', label: 'Digital invites only', hint: 'Minimal print cost' },
  { value: 'standard', label: 'Printed invitations', hint: '~Rs. 200/guest' },
  { value: 'luxury', label: 'Luxury boxed invites', hint: '~Rs. 350/guest' },
];

export const TRANSPORT_OPTIONS = [
  { value: 'none', label: 'No transport booked', hint: 'Couple arranges own' },
  { value: 'bridal', label: 'Bridal car only', hint: 'From ~Rs. 45,000' },
  { value: 'guest_buses', label: 'Guest buses', hint: 'From ~Rs. 120,000' },
  { value: 'full', label: 'Bridal + guest buses', hint: 'From ~Rs. 180,000' },
];

export const CAKE_STYLES = [
  { value: 'simple', label: 'Simple cake', hint: 'From ~Rs. 18,000' },
  { value: 'standard', label: 'Designer cake', hint: 'From ~Rs. 45,000' },
  { value: 'premium', label: 'Multi-tier + dessert table', hint: 'From ~Rs. 120,000' },
];

export const JEWELLERY_LEVELS = [
  { value: 'minimal', label: 'Minimal / rented', hint: 'From ~Rs. 150,000' },
  { value: 'standard', label: 'Standard gold set', hint: 'From ~Rs. 450,000' },
  { value: 'heavy', label: 'Heavy bridal set', hint: 'From ~Rs. 1,200,000' },
];

export const VENUE_TYPES = [
  { value: 'indoor', label: 'Indoor hall', icon: 'indoor' },
  { value: 'outdoor', label: 'Outdoor / garden', icon: 'outdoor' },
  { value: 'mixed', label: 'Indoor + outdoor', icon: 'mixed' },
];

function districtTier(district) {
  return DISTRICT_TIER[district] || 1;
}

function scaleKey(scale) {
  return SCALE_KEY[String(scale || 'standard').toLowerCase()] || 'standard';
}

function districtMult(district) {
  // Colombo hotels cost more; regional halls are slightly lower (WowWed vendor dataset).
  const tier = districtTier(district);
  if (tier >= 3) return 1.12;
  if (tier === 2) return 1.0;
  return 0.92;
}

function seasonMult(seasonal) {
  return Number(seasonal) ? 1.08 : 1;
}

function venueMult(venueType) {
  if (venueType === 'outdoor') return 1.12;
  if (venueType === 'mixed') return 1.08;
  return 1;
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

function pick(scale, prices) {
  const key = scaleKey(scale);
  return prices[key] ?? prices.standard;
}

function round1000(n) {
  return Math.round(Number(n) / 1000) * 1000;
}

/** WowWed vendor marketplace categories — same labels as Vendors page. */
export const VENDOR_ESTIMATE_GROUPS = [
  { id: 'venue', label: 'Venue & Res. Halls', icon: 'vendors' },
  { id: 'bridal', label: 'Bridal Service', icon: 'crew' },
  { id: 'groom', label: 'Groom service', icon: 'crew' },
  { id: 'photo', label: 'Photography & Videography', icon: 'analytics' },
  { id: 'jewellery', label: 'Jewellery', icon: 'sparkle' },
  { id: 'floral', label: 'Floral & Deco', icon: 'sparkle' },
  { id: 'caters', label: 'Caters', icon: 'budget' },
  { id: 'cakes', label: 'Cakes', icon: 'budget' },
  { id: 'custom', label: 'Your extras', icon: 'sparkle' },
];

const ITEM_VENDOR_MAP = {
  venue: 'venue',
  church: 'venue',
  kovil: 'venue',
  nikah: 'venue',
  poruwa: 'floral',
  mehendi: 'floral',
  catering: 'caters',
  drinks: 'caters',
  cake: 'cakes',
  photography: 'photo',
  videography: 'photo',
  bridal_attire: 'bridal',
  beauty: 'bridal',
  invitations: 'bridal',
  groom_attire: 'groom',
  transport: 'venue',
  decor: 'floral',
  lighting: 'floral',
  entertainment: 'caters',
  jewellery: 'jewellery',
  buffer: '__buffer__',
};

function buildVendorCategoryBreakdown(lineItems, total) {
  const sums = Object.fromEntries(VENDOR_ESTIMATE_GROUPS.map((g) => [g.id, 0]));
  let bufferAmount = 0;

  lineItems.forEach((item) => {
    if (String(item.id).startsWith('custom_')) {
      sums.custom += item.amount;
      return;
    }
    const key = ITEM_VENDOR_MAP[item.id];
    if (key === '__buffer__') {
      bufferAmount += item.amount;
      return;
    }
    if (key && sums[key] != null) sums[key] += item.amount;
  });

  const subtotal = Object.values(sums).reduce((sum, value) => sum + value, 0);
  if (bufferAmount > 0 && subtotal > 0) {
    VENDOR_ESTIMATE_GROUPS.forEach((group) => {
      sums[group.id] += bufferAmount * (sums[group.id] / subtotal);
    });
  }

  return VENDOR_ESTIMATE_GROUPS
    .map((group) => ({
      ...group,
      name: group.label,
      amount: round1000(sums[group.id] || 0),
    }))
    .filter((row) => row.amount > 0)
    .map((row) => ({
      ...row,
      percent: total ? Math.round((row.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function lineItem({ id, category, name, amount, qty, unitPrice, unit, note, included = true }) {
  if (!included || amount <= 0) return null;
  return {
    id,
    category,
    name,
    amount: round1000(amount),
    qty,
    unitPrice: unitPrice != null ? round1000(unitPrice) : null,
    unit: unit || 'fixed',
    note,
  };
}

function customChoiceAmount(form, fieldKey, computedAmount) {
  const custom = Number(form.customAmounts?.[fieldKey]);
  if (String(form[fieldKey]) === 'custom' && custom > 0) return custom;
  return computedAmount;
}

function customChoiceName(form, fieldKey, defaultName) {
  const label = String(form.customLabels?.[fieldKey] || '').trim();
  if (String(form[fieldKey]) === 'custom' && label) return label;
  return defaultName;
}

/** Build every budget line from couple requirements. */
export function calculateDetailedBudget(form) {
  const guests = Math.max(50, Math.min(800, Number(form.guestCount) || 150));
  const scale = scaleKey(form.scale);
  const district = form.district || 'Colombo';
  const dMult = districtMult(district);
  const sMult = seasonMult(form.seasonal);
  const vMult = venueMult(form.venueType);
  const ceremony = ceremonyKey(form.ceremonyType);
  const combined = dMult * sMult;

  const items = [];

  // —— Venue (hall hire only — food is under Caters; aligned to WowWed venue listings) ——
  const venueBase = pick(scale, { budget: 450000, standard: 950000, premium: 2200000 });
  items.push(lineItem({
    id: 'venue',
    category: 'Venue',
    name: form.venueType === 'outdoor' ? 'Outdoor venue / garden hire' : 'Reception hall hire',
    amount: venueBase * combined * vMult,
    qty: 1,
    unitPrice: venueBase * combined * vMult,
    unit: 'event',
    note: `${district} district · ${form.venueType || 'indoor'} · based on WowWed venue quotes`,
  }));

  // —— Catering (Sri Lankan plate rates: home/hall ~4k, banquet ~7k, hotel ~11–13.5k) ——
  const mealRates = {
    basic: { budget: 3800, standard: 4500, premium: 5500 },
    buffet: { budget: 5500, standard: 7000, premium: 9000 },
    premium_buffet: { budget: 9000, standard: 11000, premium: 13500 },
  };
  const meal = form.mealStyle === 'custom' ? 'buffet' : (form.mealStyle || (scale === 'budget' ? 'basic' : scale === 'premium' ? 'premium_buffet' : 'buffet'));
  const plateKey = String(form.platePriceRange || 'auto');
  const plateOverride = plateKey === 'custom'
    ? Number(form.customPlatePrice) || 0
    : (plateKey !== 'auto' ? Number(plateKey) : null);
  // Absolute plate picks stay as entered; meal packages still follow district/season.
  const mealPerHead = (mealRates[meal]?.[scale] || mealRates.buffet[scale]) * combined;
  const perHead = plateOverride ? plateOverride : mealPerHead;
  const receptionMult = form.receptionTime === 'both' ? 1.35 : form.receptionTime === 'dinner' ? 1.05 : 1;
  const plateLabel = PLATE_PRICE_RANGES.find((row) => row.value === plateKey)?.label;
  items.push(lineItem({
    id: 'catering',
    category: 'Catering',
    name: customChoiceName(form, 'mealStyle', MEAL_STYLES.find((m) => m.value === meal)?.label || 'Catering'),
    amount: customChoiceAmount(form, 'mealStyle', perHead * guests * receptionMult),
    qty: guests,
    unitPrice: perHead,
    unit: 'guest',
    note: plateOverride
      ? `${plateLabel || `Rs. ${plateOverride.toLocaleString()}/plate`} · ${RECEPTION_TIMES.find((r) => r.value === form.receptionTime)?.label || 'Lunch reception'}`
      : `~Rs. ${Math.round(perHead).toLocaleString()}/plate · service staff included; drinks separate`,
  }));

  const drinksRates = { soft: 450, standard: 850, premium: 1800 };
  const drinks = form.drinksPackage === 'custom' ? 'soft' : (form.drinksPackage || 'soft');
  if (form.drinksPackage !== 'none' && (drinksRates[drinks] || form.drinksPackage === 'custom')) {
    items.push(lineItem({
      id: 'drinks',
      category: 'Catering',
      name: customChoiceName(form, 'drinksPackage', DRINKS_PACKAGES.find((row) => row.value === drinks)?.label || 'Drinks'),
      amount: customChoiceAmount(form, 'drinksPackage', drinksRates[drinks] * guests * receptionMult),
      qty: guests,
      unitPrice: drinksRates[drinks],
      unit: 'guest',
      note: 'Typical Sri Lankan wedding soft-drink / bar package',
    }));
  }

  // —— Photography (WowWed photo listings: wedding-day ~75k, silver ~150k, premium ~350k+) ——
  const photoRates = { basic: 75000, full: 150000, premium: 350000 };
  const photo = form.photoPackage === 'custom' ? 'full' : (form.photoPackage || (scale === 'premium' ? 'premium' : scale === 'budget' ? 'basic' : 'full'));
  if (photo !== 'none' || form.photoPackage === 'custom') {
    items.push(lineItem({
      id: 'photography',
      category: 'Photography',
      name: customChoiceName(form, 'photoPackage', PHOTO_PACKAGES.find((p) => p.value === photo)?.label || 'Photography'),
      amount: customChoiceAmount(form, 'photoPackage', photoRates[photo] * dMult),
      qty: 1,
      unitPrice: photoRates[photo] * dMult,
      unit: 'package',
      note: 'Matched to WowWed photography package quotes',
    }));
  }

  // —— Videography ——
  const videoRates = { highlights: 75000, cinematic: 200000 };
  const video = form.videoPackage === 'custom' ? 'highlights' : (form.videoPackage ?? (scale === 'budget' ? 'none' : 'highlights'));
  if ((video !== 'none' && videoRates[video]) || form.videoPackage === 'custom') {
    items.push(lineItem({
      id: 'videography',
      category: 'Videography',
      name: customChoiceName(form, 'videoPackage', VIDEO_PACKAGES.find((v) => v.value === video)?.label || 'Videography'),
      amount: customChoiceAmount(form, 'videoPackage', videoRates[video] * dMult),
      qty: 1,
      unitPrice: videoRates[video] * dMult,
      unit: 'package',
      note: 'Highlights or full cinematic day; drone often extra',
    }));
  }

  // —— Attire (WowWed bridal/groom listing midpoints) ——
  const bridalRates = { rental: 45000, boutique: 120000, designer: 250000 };
  const groomRates = { rental: 25000, standard: 75000, designer: 150000 };
  const beautyRates = { basic: 25000, full: 55000, premium: 100000 };
  const bridal = form.bridalPackage === 'custom' ? 'boutique' : (form.bridalPackage || (scale === 'premium' ? 'designer' : scale === 'budget' ? 'rental' : 'boutique'));
  const groom = form.groomPackage === 'custom' ? 'standard' : (form.groomPackage || (scale === 'premium' ? 'designer' : scale === 'budget' ? 'rental' : 'standard'));
  const beauty = form.beautyPackage === 'custom' ? 'full' : (form.beautyPackage || (scale === 'premium' ? 'premium' : scale === 'budget' ? 'basic' : 'full'));

  items.push(lineItem({
    id: 'bridal_attire',
    category: 'Attire',
    name: customChoiceName(form, 'bridalPackage', BRIDAL_PACKAGES.find((row) => row.value === bridal)?.label || 'Bridal outfit'),
    amount: customChoiceAmount(form, 'bridalPackage', (bridalRates[bridal] || bridalRates.boutique) * dMult),
    qty: 1,
    unit: 'outfit',
    note: 'Saree / gown · WowWed bridal service averages',
  }));
  items.push(lineItem({
    id: 'groom_attire',
    category: 'Attire',
    name: customChoiceName(form, 'groomPackage', GROOM_PACKAGES.find((row) => row.value === groom)?.label || 'Groom outfit'),
    amount: customChoiceAmount(form, 'groomPackage', (groomRates[groom] || groomRates.standard) * dMult),
    qty: 1,
    unit: 'outfit',
    note: 'Suit / national dress · WowWed groom service averages',
  }));

  // —— Beauty ——
  items.push(lineItem({
    id: 'beauty',
    category: 'Beauty',
    name: customChoiceName(form, 'beautyPackage', BEAUTY_PACKAGES.find((row) => row.value === beauty)?.label || 'Bridal beauty'),
    amount: customChoiceAmount(form, 'beautyPackage', (beautyRates[beauty] || beautyRates.full) * dMult),
    qty: 1,
    unit: 'package',
    note: 'Trial included in full & premium packages',
  }));

  // —— Decorations (Floral & Deco listings ~25k start; full wedding décor often 150k–800k) ——
  const decorBase = { simple: 95000, standard: 275000, luxury: 650000 };
  const decor = form.decorLevel === 'custom' ? 'standard' : (form.decorLevel || (scale === 'premium' ? 'luxury' : scale === 'budget' ? 'simple' : 'standard'));
  const flowerMult = { fresh: 1, artificial: 0.5, mixed: 0.72 }[form.flowerType === 'custom' ? 'mixed' : (form.flowerType || 'fresh')] || 1;
  const lighting = form.lightingPackage === 'custom' ? 'ambient' : (form.lightingPackage || (scale === 'premium' ? 'full' : scale === 'budget' ? 'basic' : 'ambient'));
  const flowerLabel = customChoiceName(form, 'flowerType', FLOWER_TYPES.find((row) => row.value === form.flowerType)?.label || 'Fresh flowers');
  items.push(lineItem({
    id: 'decor',
    category: 'Decorations',
    name: `${flowerLabel} · ${customChoiceName(form, 'decorLevel', DECOR_LEVELS.find((d) => d.value === decor)?.label || decor)} décor`,
    amount: customChoiceAmount(form, 'decorLevel', decorBase[decor] * combined * vMult * flowerMult),
    qty: 1,
    unit: 'package',
    note: `${flowerLabel} · stage, entrance & tables · WowWed floral quotes`,
  }));
  const lightingRates = { basic: 0, ambient: 65000, full: 150000 };
  if ((lighting !== 'basic' && lightingRates[lighting]) || form.lightingPackage === 'custom') {
    items.push(lineItem({
      id: 'lighting',
      category: 'Decorations',
      name: customChoiceName(form, 'lightingPackage', LIGHTING_OPTIONS.find((row) => row.value === lighting)?.label || 'Lighting'),
      amount: customChoiceAmount(form, 'lightingPackage', lightingRates[lighting] * dMult * sMult),
      qty: 1,
      unit: 'package',
      note: 'LED uplights, dance floor & stage wash',
    }));
  }

  // —— Entertainment ——
  const entRates = { dj: 55000, band: 150000, band_dj: 220000 };
  const ent = form.entertainment === 'custom' ? 'band' : (form.entertainment ?? (scale === 'budget' ? 'dj' : scale === 'premium' ? 'band_dj' : 'band'));
  if ((ent !== 'none' && entRates[ent]) || form.entertainment === 'custom') {
    items.push(lineItem({
      id: 'entertainment',
      category: 'Entertainment',
      name: customChoiceName(form, 'entertainment', ENTERTAINMENT_OPTIONS.find((e) => e.value === ent)?.label || 'Entertainment'),
      amount: customChoiceAmount(form, 'entertainment', entRates[ent] * dMult * sMult),
      qty: 1,
      unit: 'event',
      note: 'Kandyan dancers add ~Rs. 40,000–90,000 if booked separately',
    }));
  }

  // —— Ceremony-specific ——
  if (ceremony === 'poruwa' || ceremony === 'buddhist') {
    items.push(lineItem({
      id: 'poruwa',
      category: 'Ceremony',
      name: 'Poruwa setup & ritual items',
      amount: pick(scale, { budget: 65000, standard: 120000, premium: 250000 }) * dMult,
      qty: 1,
      note: 'Ashtaka, oil lamps, settee backdrops',
    }));
  }
  if (ceremony === 'christian') {
    items.push(lineItem({
      id: 'church',
      category: 'Ceremony',
      name: 'Church donation, choir & aisle décor',
      amount: pick(scale, { budget: 40000, standard: 85000, premium: 150000 }) * dMult,
      qty: 1,
      note: 'Marriage registration documents separate',
    }));
  }
  if (ceremony === 'hindu') {
    items.push(lineItem({
      id: 'kovil',
      category: 'Ceremony',
      name: 'Kovil fees & Hindu ceremonial items',
      amount: pick(scale, { budget: 55000, standard: 100000, premium: 180000 }) * dMult,
      qty: 1,
    }));
    if (form.includeMehendi !== false) {
      items.push(lineItem({
        id: 'mehendi',
        category: 'Ceremony',
        name: 'Mehendi night',
        amount: pick(scale, { budget: 45000, standard: 85000, premium: 150000 }) * dMult,
        qty: 1,
      }));
    }
  }
  if (ceremony === 'islamic') {
    items.push(lineItem({
      id: 'nikah',
      category: 'Ceremony',
      name: 'Nikah & walima coordination',
      amount: pick(scale, { budget: 50000, standard: 95000, premium: 160000 }) * dMult,
      qty: 1,
    }));
  }

  // —— Cake (WowWed cake listings start ~15–20k; designer multi-tier ~45–180k) ——
  const cakeRates = { simple: 18000, standard: 45000, premium: 120000 };
  const cake = form.cakeStyle === 'custom' ? 'standard' : (form.cakeStyle || 'standard');
  items.push(lineItem({
    id: 'cake',
    category: 'Catering',
    name: customChoiceName(form, 'cakeStyle', 'Wedding cake'),
    amount: customChoiceAmount(form, 'cakeStyle', cakeRates[cake] * dMult),
    qty: 1,
    note: CAKE_STYLES.find((c) => c.value === cake)?.label,
  }));

  // —— Jewellery (gold bridal sets in SL market + WowWed jewellery listings) ——
  const jewelRates = { minimal: 150000, standard: 450000, heavy: 1200000 };
  const jewel = form.jewellery === 'custom' ? 'standard' : (form.jewellery || (scale === 'premium' ? 'heavy' : scale === 'budget' ? 'minimal' : 'standard'));
  items.push(lineItem({
    id: 'jewellery',
    category: 'Attire',
    name: customChoiceName(form, 'jewellery', 'Bridal jewellery allowance'),
    amount: customChoiceAmount(form, 'jewellery', jewelRates[jewel]),
    qty: 1,
    note: `${JEWELLERY_LEVELS.find((j) => j.value === jewel)?.label || 'Bridal set'} · gold market rates`,
  }));

  // —— Invitations ——
  const inviteRates = { digital: 35, standard: 220, luxury: 450 };
  const inviteStyle = form.invitationStyle === 'custom' ? 'standard' : (form.invitationStyle || (scale === 'premium' ? 'luxury' : scale === 'budget' ? 'digital' : 'standard'));
  items.push(lineItem({
    id: 'invitations',
    category: 'Invitations',
    name: customChoiceName(form, 'invitationStyle', INVITATION_STYLES.find((row) => row.value === inviteStyle)?.label || 'Invitations'),
    amount: customChoiceAmount(form, 'invitationStyle', inviteRates[inviteStyle] * guests * 0.85),
    qty: Math.round(guests * 0.85),
    unitPrice: inviteRates[inviteStyle],
    unit: 'guest',
    note: inviteStyle === 'digital' ? 'WhatsApp / email save-the-dates' : '~85% of guest list printed',
  }));

  // —— Transport ——
  const transportRates = { bridal: 45000, guest_buses: 120000, full: 180000 };
  const transport = form.transport === 'custom' ? 'bridal' : (form.transport ?? (guests >= 300 ? 'guest_buses' : 'bridal'));
  if ((transport !== 'none' && transportRates[transport]) || form.transport === 'custom') {
    const busCount = transport.includes('guest') ? Math.max(1, Math.ceil(guests / 45)) : 1;
    const busExtra = transport.includes('guest') ? (busCount - 1) * 45000 : 0;
    items.push(lineItem({
      id: 'transport',
      category: 'Transport',
      name: customChoiceName(form, 'transport', TRANSPORT_OPTIONS.find((t) => t.value === transport)?.label || 'Transport'),
      amount: customChoiceAmount(form, 'transport', transportRates[transport] * dMult + busExtra),
      qty: transport.includes('guest') ? busCount : 1,
      note: transport.includes('guest') ? `~${busCount} bus(es) for ${guests} guests` : 'Bridal car + fuel',
    }));
  }

  // —— Custom requirements ——
  (Array.isArray(form.customItems) ? form.customItems : []).forEach((row, index) => {
    const name = String(row?.name || '').trim();
    const amount = Number(row?.amount) || 0;
    if (!name || amount <= 0) return;
    items.push(lineItem({
      id: `custom_${index}`,
      category: 'Custom',
      name,
      amount,
      qty: 1,
      note: 'Your custom requirement',
    }));
  });

  // —— Misc buffer ——
  const subtotal = items.filter(Boolean).reduce((sum, row) => sum + row.amount, 0);
  const bufferPct = scale === 'budget' ? 0.06 : scale === 'premium' ? 0.1 : 0.08;
  items.push(lineItem({
    id: 'buffer',
    category: 'Vendors',
    name: 'Tips, contingencies & small extras',
    amount: subtotal * bufferPct,
    qty: 1,
    note: `${Math.round(bufferPct * 100)}% buffer for last-minute items`,
  }));

  const validItems = items.filter(Boolean);
  const total = validItems.reduce((sum, row) => sum + row.amount, 0);

  // Group by category
  const categoryMap = {};
  validItems.forEach((row) => {
    if (!categoryMap[row.category]) {
      categoryMap[row.category] = { name: row.category, amount: 0, items: [] };
    }
    categoryMap[row.category].amount += row.amount;
    categoryMap[row.category].items.push(row);
  });

  const categories = Object.values(categoryMap)
    .map((cat) => ({
      ...cat,
      amount: round1000(cat.amount),
      percent: total ? Math.round((cat.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const vendorCategories = buildVendorCategoryBreakdown(validItems, total);

  return {
    total: round1000(total),
    low: round1000(total * 0.9),
    high: round1000(total * 1.12),
    perGuest: Math.round(total / guests),
    lineItems: validItems,
    categories,
    vendorCategories,
    guests,
  };
}

export function buildRequirementDrivers(form, detail) {
  const drivers = [];
  const guests = detail.guests;

  drivers.push({
    icon: 'guests',
    title: `${guests} guests`,
    detail: `Catering alone is roughly Rs. ${detail.lineItems.find((i) => i.id === 'catering')?.unitPrice?.toLocaleString() || '—'} per head`,
  });
  drivers.push({
    icon: 'pin',
    title: form.district || 'Colombo',
    detail: districtTier(form.district) >= 3
      ? 'Colombo-area venues and vendors charge premium rates'
      : districtTier(form.district) === 2
        ? 'Regional city pricing — moderate vs Colombo'
        : 'Province pricing — typically 10–15% below Colombo',
  });
  drivers.push({
    icon: 'poruwa',
    title: form.ceremonyType || 'Ceremony',
    detail: `Ceremony-specific items included (${ceremonyKey(form.ceremonyType)} rituals)`,
  });
  drivers.push({
    icon: 'budget',
    title: form.scale || 'Standard',
    detail: `${PLATE_PRICE_RANGES.find((row) => row.value === form.platePriceRange)?.label || 'Standard plate rate'} · ${FLOWER_TYPES.find((row) => row.value === form.flowerType)?.label || 'Fresh flowers'}`,
  });
  if (form.venueType) {
    drivers.push({
      icon: 'venue',
      title: VENUE_TYPES.find((v) => v.value === form.venueType)?.label || form.venueType,
      detail: form.venueType === 'outdoor' ? 'Outdoor setups need extra décor and weather backup' : 'Indoor hall pricing applied',
    });
  }
  drivers.push({
    icon: 'calendar',
    title: Number(form.seasonal) ? 'Peak season' : 'Regular season',
    detail: Number(form.seasonal) ? '+8% on venue, catering & entertainment' : 'No seasonal uplift',
  });

  return drivers;
}

export function buildBudgetSummary(form, detail) {
  const scale = scaleKey(form.scale);
  const ceremony = ceremonyKey(form.ceremonyType);
  const season = Number(form.seasonal) ? 'peak season' : 'regular season';
  return `Based on ${detail.guests} guests, ${form.district}, ${ceremony} ceremony, ${scale} style, and ${season}, average Sri Lankan vendor quotes add up to Rs. ${detail.total.toLocaleString()} across ${detail.lineItems.length} line items.`;
}

/** Map engine categories to budget page category names. */
export const CATEGORY_BUDGET_MAP = {
  Venue: 'Venue',
  Catering: 'Catering',
  Photography: 'Photography',
  Videography: 'Videography',
  Attire: 'Attire',
  Beauty: 'Beauty',
  Decorations: 'Decorations',
  Entertainment: 'Entertainment',
  Ceremony: 'Ceremony',
  Transport: 'Transport',
  Invitations: 'Invitations',
  Vendors: 'Vendors',
};
