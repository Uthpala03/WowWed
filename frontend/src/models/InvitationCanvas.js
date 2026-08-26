import { formatInviteDate, invitationTemplates } from './InvitationTemplate';
import { InvitationTextBlock } from './InvitationTextBlock';
import { buildDefaultBlocks, getBlockTextForField } from './invitationLayouts';

/** Manages all draggable text blocks on the invitation canvas (OOP). */
export class InvitationCanvas {
  constructor(blocks = []) {
    this.blocks = blocks.map((b) => (b instanceof InvitationTextBlock ? b : new InvitationTextBlock(b)));
  }

  static fromDesign(design) {
    if (design.textBlocks?.length) {
      return new InvitationCanvas(design.textBlocks);
    }
    return new InvitationCanvas(buildDefaultBlocks(design, design.template));
  }

  getBlock(id) {
    return this.blocks.find((b) => b.id === id);
  }

  addBlock(text = '', x = 50, y = 50) {
    const template = invitationTemplates.getById('template-01');
    const block = new InvitationTextBlock({
      text,
      x,
      y,
      fontId: 'serif',
      fontSize: 20,
      color: template?.text || '#2c2416',
      align: 'center',
      width: 70,
    });
    this.blocks.push(block);
    return block;
  }

  moveBlock(id, x, y) {
    const block = this.getBlock(id);
    if (!block) return;
    block.x = Math.max(2, Math.min(98, x));
    block.y = Math.max(2, Math.min(98, y));
  }

  moveAll(dx, dy) {
    this.blocks.forEach((block) => {
      block.x = Math.max(2, Math.min(98, block.x + dx));
      block.y = Math.max(2, Math.min(98, block.y + dy));
    });
  }

  updateBlock(id, props) {
    const block = this.getBlock(id);
    if (!block) return;
    Object.assign(block, props);
    if (props.fieldKey === null) block.fieldKey = null;
  }

  updateAllStyles(props) {
    const style = {};
    ['fontId', 'fontSize', 'color', 'align', 'uppercase', 'italic', 'bold', 'letterSpacing', 'lineHeight'].forEach((key) => {
      if (props[key] !== undefined) style[key] = props[key];
    });
    this.blocks.forEach((block) => Object.assign(block, style));
  }

  removeBlock(id) {
    this.blocks = this.blocks.filter((b) => b.id !== id);
  }

  duplicateBlock(id) {
    const src = this.getBlock(id);
    if (!src) return null;
    const copy = src.clone();
    copy.id = `block-${Date.now()}`;
    copy.x = Math.min(95, src.x + 3);
    copy.y = Math.min(95, src.y + 3);
    copy.fieldKey = null;
    this.blocks.push(copy);
    return copy;
  }

  addPresetBlock(preset, design) {
    const template = invitationTemplates.getById(design.template);
    const accent = design.accentColor || template.accent;
    const text = design.textColor || template.text;
    const name1 = design.partnerOne?.trim() || 'Your name';
    const name2 = design.partnerTwo?.trim() || 'Their name';
    const presets = {
      heading: { text: 'Wedding Invitation', fontId: 'classic', fontSize: 20, color: accent, y: 18, uppercase: true, lineHeight: 1.2 },
      names: { text: `${name1}  &  ${name2}`, fontId: 'elegant', fontSize: 20, color: accent, y: 36, lineHeight: 1.15 },
      date: { text: design.weddingDate ? formatInviteDate(design.weddingDate) : 'Saturday · Date to be announced', fontId: 'classic', fontSize: 20, color: text, y: 58, uppercase: true, lineHeight: 1.25 },
      quote: { text: 'Two hearts, two families, one beautiful beginning', fontId: 'script', fontSize: 20, color: accent, y: 48, italic: true, lineHeight: 1.3 },
      venue: { text: design.venue?.trim() || 'Venue name', fontId: 'serif', fontSize: 20, color: accent, y: 68, lineHeight: 1.25 },
      rsvp: { text: 'Kindly RSVP', fontId: 'sans', fontSize: 20, color: text, y: 82, uppercase: true, lineHeight: 1.25 },
      subheading: { text: 'Together with their families', fontId: 'classic', fontSize: 20, color: text, y: 26, uppercase: true, lineHeight: 1.25 },
      body: { text: 'Add your text here', fontId: 'serif', fontSize: 20, color: text, y: 56, lineHeight: 1.25 },
    };
    const p = presets[preset] || presets.body;
    const block = new InvitationTextBlock({ ...p, x: 50, width: 78, align: 'center' });
    this.blocks.push(block);
    return block;
  }

  bringForward(id) {
    const i = this.blocks.findIndex((b) => b.id === id);
    if (i < 0 || i === this.blocks.length - 1) return;
    const [block] = this.blocks.splice(i, 1);
    this.blocks.splice(i + 1, 0, block);
    block.zIndex = (block.zIndex || 2) + 1;
  }

  sendBack(id) {
    const i = this.blocks.findIndex((b) => b.id === id);
    if (i <= 0) return;
    const [block] = this.blocks.splice(i, 1);
    this.blocks.splice(i - 1, 0, block);
    block.zIndex = Math.max(1, (block.zIndex || 2) - 1);
  }

  /** Sync linked blocks from form fields without moving them. */
  syncFromDesign(design) {
    const template = invitationTemplates.getById(design.template);
    const linkedIds = new Set(this.blocks.filter((b) => b.fieldKey).map((b) => b.id));

    this.blocks.forEach((block) => {
      if (!block.fieldKey) return;
      const text = getBlockTextForField(block.fieldKey, design, template);
      if (text !== null) block.text = text;
    });

    this.blocks = this.blocks.filter((b) => b.text?.trim() || !b.fieldKey);

    buildDefaultBlocks(design, design.template).forEach((fresh) => {
      if (!fresh.text?.trim()) return;
      const existing = this.getBlock(fresh.id);
      if (existing) return;
      if (linkedIds.has(fresh.id) || !this.blocks.some((b) => b.id === fresh.id)) {
        this.blocks.push(fresh);
      }
    });

    this.blocks.sort((a, b) => a.y - b.y);
  }

  /** Rebuild layout when template changes. */
  resetLayout(design) {
    this.blocks = buildDefaultBlocks(design, design.template);
  }

  toJSON() {
    return this.blocks.map((b) => b.toJSON());
  }
}
