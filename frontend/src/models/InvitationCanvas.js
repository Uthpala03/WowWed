import { invitationTemplates } from './InvitationTemplate';
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
      fontSize: 10,
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

  updateBlock(id, props) {
    const block = this.getBlock(id);
    if (!block) return;
    Object.assign(block, props);
    if (props.fieldKey === null) block.fieldKey = null;
  }

  removeBlock(id) {
    this.blocks = this.blocks.filter((b) => b.id !== id);
  }

  duplicateBlock(id) {
    const src = this.getBlock(id);
    if (!src) return null;
    const copy = src.clone();
    copy.id = undefined;
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
    const presets = {
      heading: { text: 'Heading', fontId: 'elegant', fontSize: 22, color: accent, y: 40 },
      subheading: { text: 'Subheading', fontId: 'classic', fontSize: 12, color: text, y: 48, uppercase: true },
      body: { text: 'Add your text here', fontId: 'serif', fontSize: 9, color: text, y: 56 },
    };
    const p = presets[preset] || presets.body;
    const block = new InvitationTextBlock({ ...p, x: 50, width: 75, align: 'center' });
    this.blocks.push(block);
    return block;
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
