import {
  applyTemplateDefaults,
  defaultInvitation,
  getResolvedColors,
  invitationFromProfile,
  invitationTemplates,
} from './InvitationTemplate';
import { InvitationCanvas } from './InvitationCanvas';
import { buildDefaultBlocks, needsLayoutRefresh } from './invitationLayouts';

/** Manages invitation design state — single OOP model for the designer. */
export class InvitationDesign {
  constructor(data = {}) {
    Object.assign(this, { ...defaultInvitation, ...data });
  }

  static load(profile, saved) {
    const data = invitationFromProfile(profile, saved);
    const design = new InvitationDesign(data);
    if (needsLayoutRefresh(design.textBlocks)) {
      design.textBlocks = buildDefaultBlocks(design, design.template).map((b) => b.toJSON());
    }
    return design;
  }

  getTemplate() {
    return invitationTemplates.getById(this.template);
  }

  getColors() {
    return getResolvedColors(this);
  }

  getCanvas() {
    return InvitationCanvas.fromDesign(this);
  }

  update(field, value) {
    this[field] = value;
    return this;
  }

  applyTemplate(templateId) {
    Object.assign(this, applyTemplateDefaults(this.toJSON(), templateId));
    this.textBlocks = buildDefaultBlocks(this, this.template).map((b) => b.toJSON());
    return this;
  }

  syncTextBlocks() {
    const canvas = this.getCanvas();
    canvas.syncFromDesign(this);
    this.textBlocks = canvas.toJSON();
    return this;
  }

  fillFromProfile(profile) {
    if (!profile) return this;
    if (profile.partnerOne) this.partnerOne = profile.partnerOne;
    if (profile.partnerTwo) this.partnerTwo = profile.partnerTwo;
    if (profile.weddingDate) this.weddingDate = profile.weddingDate;
    if (profile.venue) this.venue = profile.venue;
    if (profile.district) this.district = profile.district;
    this.syncTextBlocks();
    return this;
  }

  reset(profile) {
    Object.assign(this, invitationFromProfile(profile, null));
    this.textBlocks = buildDefaultBlocks(this, this.template).map((b) => b.toJSON());
    return this;
  }

  toJSON() {
    return { ...this };
  }
}
