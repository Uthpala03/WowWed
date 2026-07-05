import { CULTURE_DEFAULTS, TEMPLATE_DEFINITIONS } from './invitationTemplateData';
import { invitationAssetUrl } from '../utils/invitationAssets';

export class InvitationTemplate {
  constructor(config) {
    const cultureDefaults = CULTURE_DEFAULTS[config.culture] || CULTURE_DEFAULTS.church;
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.accent = config.accent;
    this.bg = '#fffef9';
    this.text = config.text;
    this.font = config.font;
    this.border = 'photo';
    this.category = config.category;
    this.culture = config.culture;
    this.layout = 'photo-center';
    this.culturalTitle = config.culturalTitle || cultureDefaults.culturalTitle;
    this.defaultTagline = cultureDefaults.defaultTagline;
    this.defaultMessage = cultureDefaults.defaultMessage;
    this.defaultCeremonyNote = cultureDefaults.defaultCeremonyNote;
    this.decorImage = invitationAssetUrl(config.file);
    this.contentInset = config.inset;
    this.usePhotoCouple = true;
  }
}

export class InvitationCatalog {
  constructor(items = []) {
    this.items = items;
  }

  getAll() {
    return this.items;
  }

  getByCulture(culture) {
    if (culture === 'all') return this.items;
    return this.items.filter((t) => t.culture === culture);
  }

  getById(id) {
    const resolved = LEGACY_TEMPLATE_MAP[id] || id;
    return this.items.find((t) => t.id === resolved) || this.items[0];
  }
}

const LEGACY_TEMPLATE_MAP = {
  classic: 'template-12',
  floral: 'template-02',
  modern: 'template-05',
  poruwa: 'template-12',
  'poruwa-heritage': 'template-12',
  royal: 'template-01',
  'golden-palace': 'template-01',
  sunset: 'template-15',
  'coastal-lanka': 'template-15',
  'ivory-lace': 'template-24',
  'garden-wreath': 'template-15',
  'church-grace': 'template-03',
  'black-tie': 'template-07',
  'blush-roses': 'template-23',
  'sinhala-kandyan': 'template-12',
  'sinhala-gold-mandala': 'template-01',
  'sinhala-watercolor': 'template-15',
  'church-floral': 'template-02',
  'church-elegant': 'template-04',
  'tamil-jasmine': 'template-08',
  'tamil-temple-gold': 'template-01',
  'muslim-nikkah': 'template-14',
  'muslim-classic': 'template-14',
};

export function normalizeInvitationDesign(design) {
  if (!design) return design;
  const templateId = LEGACY_TEMPLATE_MAP[design.template] || design.template;
  return {
    ...design,
    template: invitationTemplates.getById(templateId).id,
    cardSize: design.cardSize || 'portrait-5x7',
  };
}

export const cardSizeOptions = [
  { id: 'portrait-5x7', label: '5×7″ Portrait', sublabel: 'Standard card', width: 420, height: 560 },
  { id: 'portrait-a5', label: 'A5 Portrait', sublabel: '148 × 210 mm', width: 420, height: 594 },
  { id: 'portrait-4x6', label: '4×6″ Portrait', sublabel: 'Compact card', width: 360, height: 480 },
  { id: 'square-6', label: '6×6″ Square', sublabel: 'Modern square', width: 480, height: 480 },
  { id: 'landscape-7x5', label: '7×5″ Landscape', sublabel: 'Wide format', width: 560, height: 400 },
];

export function getCardSize(id) {
  return cardSizeOptions.find((s) => s.id === id) || cardSizeOptions[0];
}

export const cultureOptions = [
  { id: 'all', label: 'All Templates', emoji: '✨' },
  { id: 'sinhala', label: 'Sinhala', emoji: '🪷' },
  { id: 'church', label: 'Church', emoji: '⛪' },
  { id: 'tamil', label: 'Tamil', emoji: '🌼' },
  { id: 'muslim', label: 'Muslim', emoji: '🕌' },
  { id: 'luxury', label: 'Luxury', emoji: '👑' },
  { id: 'modern', label: 'Modern', emoji: '🌿' },
];

export const invitationTemplates = new InvitationCatalog(
  TEMPLATE_DEFINITIONS.map((def) => new InvitationTemplate(def)),
);

export const fontOptions = [
  { id: 'serif', label: 'Playfair Serif', family: "'Playfair Display', Georgia, serif", sample: 'Aa' },
  { id: 'classic', label: 'Cormorant Classic', family: "'Cormorant Garamond', Georgia, serif", sample: 'Aa' },
  { id: 'elegant', label: 'Great Vibes Script', family: "'Great Vibes', 'Brush Script MT', cursive", sample: 'Aa', namesOnly: true },
  { id: 'sans', label: 'Lato Modern', family: "'Lato', system-ui, sans-serif", sample: 'Aa' },
];

export const accentPresets = [
  '#b8860b', '#c9a227', '#d4af37', '#8b4557', '#5a7247', '#8e6e73', '#c0392b',
  '#2d5a3d', '#6b8f71', '#a67c52', '#9a7209', '#5c3d2e',
];

export const defaultInvitation = {
  template: 'template-12',
  cardSize: 'portrait-5x7',
  partnerOne: '',
  partnerTwo: '',
  parentOneFamily: '',
  parentTwoFamily: '',
  culturalTitle: '',
  tagline: '',
  message: '',
  weddingDate: '',
  weddingTime: '10:00 AM',
  weddingEndTime: '4:00 PM',
  venue: '',
  venueAddress: '',
  district: '',
  ceremonyType: '',
  ceremonyNote: '',
  font: 'elegant',
  accentColor: '',
  textColor: '',
  rsvpText: 'Kindly RSVP at your earliest convenience',
  rsvpContact: '',
  rsvpDeadline: '',
  showDecorations: true,
  showCoupleArt: false,
  textBlocks: [],
};

export function applyTemplateDefaults(design, templateId) {
  const t = invitationTemplates.getById(templateId);
  const cultureDefaults = CULTURE_DEFAULTS[t.culture] || CULTURE_DEFAULTS.church;
  return {
    ...design,
    template: templateId,
    font: t.font,
    accentColor: '',
    textColor: '',
    culturalTitle: t.culturalTitle,
    tagline: design.tagline || t.defaultTagline,
    message: design.message || '',
    ceremonyNote: design.ceremonyNote || '',
    ceremonyType: cultureDefaults.ceremonyType,
    showCoupleArt: false,
  };
}

export function invitationFromProfile(profile, saved) {
  const base = normalizeInvitationDesign({ ...defaultInvitation, ...(saved || {}) });
  const template = invitationTemplates.getById(base.template);
  const merged = {
    ...base,
    culturalTitle: base.culturalTitle || template.culturalTitle,
    tagline: base.tagline || template.defaultTagline,
    message: base.message || template.defaultMessage,
    ceremonyNote: base.ceremonyNote || template.defaultCeremonyNote,
    showCoupleArt: false,
  };
  if (!profile) return merged;
  return {
    ...merged,
    partnerOne: merged.partnerOne || profile.partnerOne || '',
    partnerTwo: merged.partnerTwo || profile.partnerTwo || '',
    weddingDate: merged.weddingDate || profile.weddingDate || '',
    venue: merged.venue || profile.venue || '',
    district: merged.district || profile.district || '',
    ceremonyType: merged.ceremonyType || profile.ceremonyType || '',
  };
}

export function formatInviteDate(dateStr, style = 'long') {
  if (!dateStr) return 'Date to be announced';
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    if (style === 'short') {
      const day = d.getDate();
      const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
      return `${day}${suffix} ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()} ${d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}`;
    }
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getTemplatePreviewDesign(templateId) {
  return applyTemplateDefaults({
    ...defaultInvitation,
    template: templateId,
    partnerOne: 'Amaya',
    partnerTwo: 'Dilshan',
    parentOneFamily: 'Mr & Mrs Perera',
    parentTwoFamily: 'Mr & Mrs Silva',
    weddingDate: '2026-06-15',
    venue: 'Grand Ballroom',
    venueAddress: '200 Union Place, Colombo 00200',
    district: 'Colombo',
    showDecorations: true,
    showCoupleArt: false,
  }, templateId);
}

export function getResolvedColors(design) {
  const template = invitationTemplates.getById(design.template);
  return {
    accent: design.accentColor || template.accent,
    text: design.textColor || template.text,
    bg: template.bg,
  };
}
