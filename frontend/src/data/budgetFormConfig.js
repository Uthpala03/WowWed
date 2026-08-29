import {
  BEAUTY_PACKAGES,
  BRIDAL_PACKAGES,
  CAKE_STYLES,
  COST_CEREMONIES,
  COST_DISTRICTS,
  COST_SCALES,
  DECOR_LEVELS,
  DRINKS_PACKAGES,
  ENTERTAINMENT_OPTIONS,
  FLOWER_TYPES,
  GROOM_PACKAGES,
  INVITATION_STYLES,
  JEWELLERY_LEVELS,
  LIGHTING_OPTIONS,
  MEAL_STYLES,
  PHOTO_PACKAGES,
  PLATE_PRICE_RANGES,
  RECEPTION_TIMES,
  TRANSPORT_OPTIONS,
  VENUE_TYPES,
  VIDEO_PACKAGES,
} from '../utils/costPrediction';

export const CUSTOM_VALUE = 'custom';

export const CUSTOM_SELECT_OPTION = {
  value: CUSTOM_VALUE,
  label: 'Custom — add your own',
  icon: 'sparkle',
};

const CEREMONY_ICONS = {
  Poruwa: 'poruwa',
  Buddhist: 'poruwa',
  Hindu: 'hindu',
  Christian: 'church',
  Islamic: 'nikah',
};

export const BUDGET_FORM_FIELDS = [
  {
    key: 'scale',
    label: 'Wedding style',
    icon: 'sparkle',
    options: COST_SCALES.map((s) => ({ value: s.value, label: `${s.label} (${s.hint})`, icon: 'sparkle' })),
  },
  {
    key: 'guestCount',
    label: 'Guests coming (RSVP)',
    icon: 'guests',
    type: 'rsvp-count',
  },
  {
    key: 'district',
    label: 'District',
    icon: 'pin',
    options: COST_DISTRICTS.map((d) => ({ value: d, label: d, icon: 'pin' })),
  },
  {
    key: 'ceremonyType',
    label: 'Ceremony',
    icon: 'poruwa',
    options: COST_CEREMONIES.map((c) => ({
      value: c.value,
      label: c.label,
      icon: CEREMONY_ICONS[c.value] || 'poruwa',
    })),
  },
  {
    key: 'venueType',
    label: 'Venue',
    icon: 'venue',
    options: VENUE_TYPES.map((v) => ({ value: v.value, label: v.label, icon: v.value === 'outdoor' ? 'outdoor' : 'indoor' })),
  },
  {
    key: 'seasonal',
    label: 'Season',
    icon: 'calendar',
    options: [
      { value: 0, label: 'Regular season', icon: 'calendar' },
      { value: 1, label: 'Peak season (+8%)', icon: 'sparkle' },
    ],
  },
  {
    key: 'mealStyle',
    label: 'Meals & catering',
    icon: 'catering',
    options: MEAL_STYLES.map((m) => ({ value: m.value, label: m.label, icon: 'catering' })),
    amountHint: 'Your catering estimate (Rs.)',
  },
  {
    key: 'platePriceRange',
    label: 'Plate price',
    icon: 'budget',
    options: PLATE_PRICE_RANGES.filter((p) => p.value !== 'custom').map((p) => ({ value: p.value, label: p.label, icon: 'budget' })),
    customInput: 'plate',
  },
  {
    key: 'drinksPackage',
    label: 'Drinks',
    icon: 'catering',
    options: DRINKS_PACKAGES.map((d) => ({ value: d.value, label: d.label, icon: 'catering' })),
    amountHint: 'Your drinks estimate (Rs.)',
  },
  {
    key: 'receptionTime',
    label: 'Reception time',
    icon: 'calendar',
    options: RECEPTION_TIMES.map((r) => ({ value: r.value, label: r.label, icon: 'calendar' })),
  },
  {
    key: 'photoPackage',
    label: 'Photography',
    icon: 'camera',
    options: PHOTO_PACKAGES.map((p) => ({ value: p.value, label: p.label, icon: 'camera' })),
    amountHint: 'Your photography estimate (Rs.)',
  },
  {
    key: 'videoPackage',
    label: 'Videography',
    icon: 'camera',
    options: VIDEO_PACKAGES.map((v) => ({ value: v.value, label: v.label, icon: 'camera' })),
    amountHint: 'Your videography estimate (Rs.)',
  },
  {
    key: 'decorLevel',
    label: 'Décor level',
    icon: 'floral',
    options: DECOR_LEVELS.map((d) => ({ value: d.value, label: d.label, icon: 'floral' })),
    amountHint: 'Your décor estimate (Rs.)',
  },
  {
    key: 'flowerType',
    label: 'Flowers',
    icon: 'floral',
    options: FLOWER_TYPES.map((f) => ({ value: f.value, label: f.label, icon: 'floral' })),
  },
  {
    key: 'lightingPackage',
    label: 'Lighting',
    icon: 'sparkle',
    options: LIGHTING_OPTIONS.map((l) => ({ value: l.value, label: l.label, icon: 'sparkle' })),
    amountHint: 'Your lighting estimate (Rs.)',
  },
  {
    key: 'bridalPackage',
    label: 'Bridal outfit',
    icon: 'bridal',
    options: BRIDAL_PACKAGES.map((b) => ({ value: b.value, label: b.label, icon: 'bridal' })),
    amountHint: 'Your bridal outfit estimate (Rs.)',
  },
  {
    key: 'groomPackage',
    label: 'Groom outfit',
    icon: 'groom',
    options: GROOM_PACKAGES.map((g) => ({ value: g.value, label: g.label, icon: 'groom' })),
    amountHint: 'Your groom outfit estimate (Rs.)',
  },
  {
    key: 'beautyPackage',
    label: 'Hair & makeup',
    icon: 'ring',
    options: BEAUTY_PACKAGES.map((b) => ({ value: b.value, label: b.label, icon: 'ring' })),
    amountHint: 'Your beauty estimate (Rs.)',
  },
  {
    key: 'jewellery',
    label: 'Jewellery',
    icon: 'ring',
    options: JEWELLERY_LEVELS.map((j) => ({ value: j.value, label: j.label, icon: 'ring' })),
    amountHint: 'Your jewellery estimate (Rs.)',
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    icon: 'reception',
    options: ENTERTAINMENT_OPTIONS.map((e) => ({ value: e.value, label: e.label, icon: 'reception' })),
    amountHint: 'Your entertainment estimate (Rs.)',
  },
  {
    key: 'transport',
    label: 'Transport',
    icon: 'pin',
    options: TRANSPORT_OPTIONS.map((t) => ({ value: t.value, label: t.label, icon: 'pin' })),
    amountHint: 'Your transport estimate (Rs.)',
  },
  {
    key: 'cakeStyle',
    label: 'Wedding cake',
    icon: 'cake',
    options: CAKE_STYLES.map((c) => ({ value: c.value, label: c.label, icon: 'cake' })),
    amountHint: 'Your cake estimate (Rs.)',
  },
  {
    key: 'invitationStyle',
    label: 'Invitations',
    icon: 'invitations',
    options: INVITATION_STYLES.map((i) => ({ value: i.value, label: i.label, icon: 'invitations' })),
    amountHint: 'Your invitations estimate (Rs.)',
  },
];

export function optionsWithCustom(options) {
  const list = options || [];
  if (list.some((opt) => String(opt.value) === CUSTOM_VALUE)) return list;
  return [...list, CUSTOM_SELECT_OPTION];
}

export function fieldSelectedLabel(form, field) {
  const raw = form[field.key];
  if (field.type === 'rsvp-count' || field.key === 'guestCount') return String(raw || '');
  if (String(raw) === CUSTOM_VALUE) {
    return form.customLabels?.[field.key] || 'Custom choice';
  }
  const match = field.options?.find((opt) => String(opt.value) === String(raw));
  return match?.label || String(raw || '—');
}

export function buildFormDetailsList(form) {
  return BUDGET_FORM_FIELDS.map((field) => {
    let value = fieldSelectedLabel(form, field);
    if (field.key === 'platePriceRange' && form.platePriceRange === CUSTOM_VALUE && form.customPlatePrice) {
      value = `Rs. ${Number(form.customPlatePrice).toLocaleString()}/plate`;
    } else if (String(form[field.key]) === CUSTOM_VALUE && form.customAmounts?.[field.key]) {
      value = `${value} · Rs. ${Number(form.customAmounts[field.key]).toLocaleString()}`;
    }
    return { key: field.key, label: field.label, value };
  });
}
