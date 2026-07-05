import { invitationTemplates } from './InvitationTemplate';
import { InvitationTextBlock, resetBlockCounter } from './InvitationTextBlock';

function parsePct(str) {
  return parseFloat(String(str || '').replace('%', '')) || 0;
}

function getTextZone(template) {
  const inset = template.contentInset || { top: '12%', bottom: '28%', left: '10%', right: '10%' };
  const top = parsePct(inset.top);
  const bottom = parsePct(inset.bottom);
  const left = parsePct(inset.left);
  const right = parsePct(inset.right);
  return {
    x: 50,
    width: Math.max(68, 100 - left - right),
    yStart: top + 0.5,
    yEnd: 100 - bottom - 1,
  };
}

function yPos(zone, ratio) {
  return zone.yStart + (zone.yEnd - zone.yStart) * ratio;
}

function fmtDateLong(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    const day = d.getDate();
    const suffix = [1, 21, 31].includes(day) ? 'ST' : [2, 22].includes(day) ? 'ND' : [3, 23].includes(day) ? 'RD' : 'TH';
    return `${d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()} ${day}${suffix} ${d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function fmtNames(design) {
  const a = design.partnerOne?.trim();
  const b = design.partnerTwo?.trim();
  if (a && b) return `${a} & ${b}`;
  return a || b || '';
}

export function fmtParentOne(design) {
  const p = design.parentOneFamily?.trim();
  return p ? `(Daughter/Son of ${p})` : '';
}

export function fmtParentTwo(design) {
  const p = design.parentTwoFamily?.trim();
  return p ? `(Daughter/Son of ${p})` : '';
}

export function fmtVenueName(design) {
  return design.venue?.trim() || '';
}

export function fmtVenueAddress(design) {
  return [design.venueAddress, design.district].map((s) => s?.trim()).filter(Boolean).join(', ');
}

export function fmtTime(design) {
  const from = design.weddingTime?.trim();
  const to = design.weddingEndTime?.trim();
  if (from && to) return `FROM ${from} TO ${to}`;
  if (from) return `AT ${from}`;
  return '';
}

const INTRO_LINE = 'WE JOYFULLY INVITE YOU TO CELEBRATE THE MARRIAGE OF';
const QUOTE_LINE = '♥  TWO HEARTS, TWO FAMILIES, ONE BEAUTIFUL BEGINNING  ♥';
const FOOTER_LINE = 'YOUR PRESENCE WILL MAKE OUR SPECIAL DAY EVEN MORE MEMORABLE';

export function needsLayoutRefresh(textBlocks) {
  if (!textBlocks?.length) return true;
  const required = ['intro', 'quote', 'footer', 'venue-label', 'partnerOne', 'partnerTwo', 'amp'];
  const ids = new Set(textBlocks.map((b) => b.id));
  if (required.some((id) => !ids.has(id))) return true;
  return textBlocks.some((b) => b.id === 'names' || b.text === 'Your message here');
}

/** Full professional wedding invitation layout (like real printed cards). */
export function buildDefaultBlocks(design, templateId) {
  resetBlockCounter();
  const template = invitationTemplates.getById(templateId);
  const accent = design.accentColor || template.accent;
  const text = design.textColor || template.text;
  const nameFont = template.font || 'elegant';
  const zone = getTextZone(template);
  const d = design;

  const blocks = [];
  const push = (props) => {
    if (!props.text?.trim()) return;
    blocks.push(new InvitationTextBlock({
      x: zone.x,
      width: zone.width,
      align: 'center',
      color: text,
      ...props,
    }));
  };

  const title = d.culturalTitle || template.culturalTitle || 'Wedding Invitation';
  const tagline = d.tagline?.trim() || 'Together with their families';
  const name1 = d.partnerOne?.trim() || 'Partner 1';
  const name2 = d.partnerTwo?.trim() || 'Partner 2';
  const parent1 = fmtParentOne(d);
  const parent2 = fmtParentTwo(d);
  const date = fmtDateLong(d.weddingDate);
  const time = fmtTime(d);
  const venueName = fmtVenueName(d);
  const venueAddr = fmtVenueAddress(d);

  push({
    id: 'cultural', fieldKey: 'culturalTitle', text: title,
    y: yPos(zone, 0.03), fontId: 'classic', fontSize: 9.5, color: accent,
  });
  push({
    id: 'intro', text: INTRO_LINE,
    y: yPos(zone, 0.08), fontId: 'sans', fontSize: 5.2, uppercase: true,
  });
  push({
    id: 'tagline', fieldKey: 'tagline', text: tagline,
    y: yPos(zone, 0.12), fontId: 'sans', fontSize: 5.5, uppercase: true,
  });
  push({
    id: 'partnerOne', fieldKey: 'partnerOne', text: name1,
    y: yPos(zone, 0.18), fontId: nameFont, fontSize: 22, color: accent,
  });
  push({
    id: 'amp', text: '&',
    y: yPos(zone, 0.24), fontId: 'classic', fontSize: 14, color: accent,
  });
  push({
    id: 'partnerTwo', fieldKey: 'partnerTwo', text: name2,
    y: yPos(zone, 0.29), fontId: nameFont, fontSize: 22, color: accent,
  });
  if (parent1) {
    push({
      id: 'parentOne', fieldKey: 'parentOneFamily', text: parent1,
      y: yPos(zone, 0.35), fontId: 'serif', fontSize: 6.2, italic: true,
    });
  }
  if (parent2) {
    push({
      id: 'parentTwo', fieldKey: 'parentTwoFamily', text: parent2,
      y: yPos(zone, 0.39), fontId: 'serif', fontSize: 6.2, italic: true,
    });
  }
  push({
    id: 'quote', text: QUOTE_LINE,
    y: yPos(zone, 0.44), fontId: 'sans', fontSize: 5, color: accent, uppercase: true,
  });
  if (date) {
    push({
      id: 'date', fieldKey: 'weddingDate', text: date,
      y: yPos(zone, 0.52), fontId: 'classic', fontSize: 8, uppercase: true,
    });
  }
  if (time) {
    push({
      id: 'time', fieldKey: 'weddingTime', text: time,
      y: yPos(zone, 0.58), fontId: 'sans', fontSize: 7, uppercase: true,
    });
  }
  if (venueName || venueAddr) {
    push({
      id: 'venue-label', text: '—  VENUE  —',
      y: yPos(zone, 0.64), fontId: 'sans', fontSize: 6, color: accent, uppercase: true,
    });
  }
  if (venueName) {
    push({
      id: 'venue', fieldKey: 'venue', text: venueName,
      y: yPos(zone, 0.69), fontId: 'classic', fontSize: 9.5, color: accent,
    });
  }
  if (venueAddr) {
    push({
      id: 'address', fieldKey: 'venueAddress', text: venueAddr,
      y: yPos(zone, 0.74), fontId: 'serif', fontSize: 7,
    });
  }
  if (d.rsvpContact?.trim()) {
    push({
      id: 'rsvp', fieldKey: 'rsvpContact', text: `RSVP  ·  ${d.rsvpContact.trim()}`,
      y: yPos(zone, 0.80), fontId: 'sans', fontSize: 5.5, uppercase: true,
    });
  }
  push({
    id: 'footer', text: FOOTER_LINE,
    y: yPos(zone, 0.88), fontId: 'sans', fontSize: 4.8, uppercase: true,
  });

  return blocks;
}

export function getBlockTextForField(fieldKey, design, template) {
  switch (fieldKey) {
    case 'culturalTitle': return design.culturalTitle || template.culturalTitle || 'Wedding Invitation';
    case 'tagline': return design.tagline?.trim() || 'Together with their families';
    case 'names': return fmtNames(design);
    case 'partnerOne': return design.partnerOne?.trim() || '';
    case 'partnerTwo': return design.partnerTwo?.trim() || '';
    case 'parentOneFamily': return fmtParentOne(design);
    case 'parentTwoFamily': return fmtParentTwo(design);
    case 'message': return design.message?.trim() || '';
    case 'weddingDate': return fmtDateLong(design.weddingDate);
    case 'weddingTime': return fmtTime(design);
    case 'venue': return fmtVenueName(design);
    case 'venueAddress':
    case 'district': return fmtVenueAddress(design);
    case 'rsvpContact': return design.rsvpContact?.trim() ? `RSVP  ·  ${design.rsvpContact.trim()}` : '';
    default: return null;
  }
}
