import { fontOptions } from './InvitationTemplate';

let blockCounter = 0;

/** Single text element on the invitation canvas (OOP). */
export class InvitationTextBlock {
  constructor({
    id,
    text = '',
    x = 50,
    y = 50,
    fontId = 'serif',
    color = '#2c2416',
    fontSize = 14,
    align = 'center',
    width = 80,
    fieldKey = null,
    uppercase = false,
    italic = false,
    bold = false,
  }) {
    this.id = id || `block-${++blockCounter}`;
    this.text = text;
    this.x = x;
    this.y = y;
    this.fontId = fontId;
    this.color = color;
    this.fontSize = fontSize;
    this.align = align;
    this.width = width;
    this.fieldKey = fieldKey;
    this.uppercase = uppercase;
    this.italic = italic;
  }

  getFontFamily() {
    const f = fontOptions.find((o) => o.id === this.fontId);
    return f?.family || 'Georgia, serif';
  }

  clone() {
    return new InvitationTextBlock({ ...this.toJSON() });
  }

  toJSON() {
    return {
      id: this.id,
      text: this.text,
      x: this.x,
      y: this.y,
      fontId: this.fontId,
      color: this.color,
      fontSize: this.fontSize,
      align: this.align,
      width: this.width,
      fieldKey: this.fieldKey,
      uppercase: this.uppercase,
      italic: this.italic,
      bold: this.bold,
    };
  }
}

export function resetBlockCounter() {
  blockCounter = 0;
}
