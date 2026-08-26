import { invitationTemplates } from './InvitationTemplate';
import { InvitationTextBlock, resetBlockCounter } from './InvitationTextBlock';

export function fmtNames(design) {
  const a = design.partnerOne?.trim();
  const b = design.partnerTwo?.trim();
  if (a && b) return `${a}  &  ${b}`;
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
  if (from && to) return `${from}  –  ${to}`;
  if (from) return from;
  return '';
}

function fmtDateLong(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function needsLayoutRefresh(textBlocks) {
  if (!textBlocks?.length) return true;
  const ids = new Set(textBlocks.map((b) => b.id));
  if (!ids.has('names')) return true;
  if (ids.has('amp') || ids.has('intro') || ids.has('quote') || ids.has('footer') || ids.has('venue-label')) {
    return true;
  }
  return false;
}

/** Compact printed-card layout — names stay readable and off the couple art. */
export function buildDefaultBlocks(design, templateId) {
  resetBlockCounter();
  const template = invitationTemplates.getById(templateId);
  const accent = design.accentColor || template.accent;
  const text = design.textColor || template.text;
  const nameFont = template.font || 'elegant';
  const artLayout = template.layout === 'art';
  const d = design;

  const blocks = [];
  const push = (props) => {
    if (!props.text?.trim()) return;
    blocks.push(new InvitationTextBlock({
      x: 50,
      width: 78,
      align: 'center',
      color: text,
      ...props,
    }));
  };

  const title = d.culturalTitle || template.culturalTitle || 'Wedding Invitation';
  const tagline = d.tagline?.trim() || 'Together with their families';
  const names = fmtNames(d) || `${d.partnerOne?.trim() || 'Partner 1'}  &  ${d.partnerTwo?.trim() || 'Partner 2'}`;
  const parent1 = fmtParentOne(d);
  const parent2 = fmtParentTwo(d);
  const date = fmtDateLong(d.weddingDate);
  const time = fmtTime(d);
  const venueName = fmtVenueName(d);
  const venueAddr = fmtVenueAddress(d);

  if (artLayout) {
    push({
      id: 'names', fieldKey: 'names', text: names,
      y: 68, fontId: nameFont, fontSize: 20, color: accent, width: 84, lineHeight: 1.15,
    });
    if (date) {
      push({
        id: 'date', fieldKey: 'weddingDate', text: date,
        y: 76, fontId: 'classic', fontSize: 8, uppercase: true, width: 80,
      });
    }
    if (time) {
      push({
        id: 'time', fieldKey: 'weddingTime', text: time,
        y: 81, fontId: 'sans', fontSize: 7, uppercase: true,
      });
    }
    if (venueName) {
      push({
        id: 'venue', fieldKey: 'venue', text: venueName,
        y: 86, fontId: 'classic', fontSize: 9, color: accent,
      });
    }
    return blocks;
  }

  const showTitle = title && title !== names;
  if (showTitle) {
    push({
      id: 'cultural', fieldKey: 'culturalTitle', text: title,
      y: 22, fontId: 'classic', fontSize: 8.5, color: accent, uppercase: true, letterSpacing: 0.12, width: 86,
    });
  }
  push({
    id: 'tagline', fieldKey: 'tagline', text: tagline,
    y: showTitle ? 27 : 22, fontId: 'sans', fontSize: 5.8, uppercase: true, letterSpacing: 0.12, width: 86,
  });
  push({
    id: 'names', fieldKey: 'names', text: names,
      y: showTitle ? 34 : 30, fontId: nameFont, fontSize: 20, color: accent, width: 88, lineHeight: 1.15,
  });
  if (parent1) {
    push({
      id: 'parentOne', fieldKey: 'parentOneFamily', text: parent1,
      y: 40, fontId: 'serif', fontSize: 6, italic: true, width: 80,
    });
  }
  if (parent2) {
    push({
      id: 'parentTwo', fieldKey: 'parentTwoFamily', text: parent2,
      y: parent1 ? 43.5 : 40, fontId: 'serif', fontSize: 6, italic: true, width: 80,
    });
  }
  const afterParents = parent1 && parent2 ? 48 : parent1 || parent2 ? 44.5 : 41.5;
  if (date) {
    push({
      id: 'date', fieldKey: 'weddingDate', text: date,
      y: afterParents, fontId: 'classic', fontSize: 8.2, uppercase: true, width: 86,
    });
  }
  if (time) {
    push({
      id: 'time', fieldKey: 'weddingTime', text: time,
      y: afterParents + 4.6, fontId: 'sans', fontSize: 7.2, uppercase: true, width: 80,
    });
  }
  if (venueName) {
    push({
      id: 'venue', fieldKey: 'venue', text: venueName,
      y: afterParents + (time ? 9.6 : 5), fontId: 'classic', fontSize: 10, color: accent, width: 80,
    });
  }
  if (venueAddr) {
    push({
      id: 'address', fieldKey: 'venueAddress', text: venueAddr,
      y: afterParents + (time ? 13.8 : 9.2), fontId: 'serif', fontSize: 6.5, width: 80,
    });
  }
  if (d.rsvpContact?.trim()) {
    push({
      id: 'rsvp', fieldKey: 'rsvpContact', text: `RSVP  ·  ${d.rsvpContact.trim()}`,
      y: 88, fontId: 'sans', fontSize: 6, uppercase: true,
    });
  }

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
