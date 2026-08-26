import { InvitationCanvas } from './InvitationCanvas';
import { InvitationDesign } from './InvitationDesign';
import { buildDefaultBlocks } from './invitationLayouts';
import { buildInvitationExportHtml } from '../utils/invitationExportHtml';
import { saveInvitation } from '../utils/storage';

const SYNC_FIELDS = new Set([
  'culturalTitle', 'tagline', 'partnerOne', 'partnerTwo',
  'parentOneFamily', 'parentTwoFamily', 'message', 'weddingDate',
  'weddingTime', 'weddingEndTime', 'venue', 'venueAddress', 'district',
  'rsvpContact',
]);

/** OOP service — all invitation editor actions in one place. */
export class InvitationStudioService {
  static patch(design, changes) {
    const next = new InvitationDesign({ ...design.toJSON(), ...changes });
    const shouldSync = !changes.textBlocks
      && Object.keys(changes).some((k) => SYNC_FIELDS.has(k));
    if (shouldSync) next.syncTextBlocks();
    return next;
  }

  static selectTemplate(design, templateId) {
    const next = new InvitationDesign(design.toJSON());
    next.applyTemplate(templateId);
    return next;
  }

  static fillFromProfile(design, profile) {
    const next = new InvitationDesign(design.toJSON());
    next.fillFromProfile(profile);
    return next;
  }

  static updateBlocks(design, updater) {
    const canvas = InvitationCanvas.fromDesign(design);
    updater(canvas);
    return new InvitationDesign({ ...design.toJSON(), textBlocks: canvas.toJSON() });
  }

  static moveBlock(design, id, x, y) {
    return InvitationStudioService.updateBlocks(design, (c) => c.moveBlock(id, x, y));
  }

  static moveAllBlocks(design, dx, dy) {
    return InvitationStudioService.updateBlocks(design, (c) => c.moveAll(dx, dy));
  }

  static editBlock(design, id, props) {
    return InvitationStudioService.updateBlocks(design, (c) => c.updateBlock(id, props));
  }

  static editAllStyles(design, props) {
    return InvitationStudioService.updateBlocks(design, (c) => c.updateAllStyles(props));
  }

  static updateBlockText(design, id, text) {
    return InvitationStudioService.updateBlocks(design, (c) => {
      c.updateBlock(id, { text, fieldKey: null });
    });
  }

  static addBlock(design) {
    const canvas = InvitationCanvas.fromDesign(design);
    const block = canvas.addBlock('Your text here', 50, 55);
    return {
      design: new InvitationDesign({ ...design.toJSON(), textBlocks: canvas.toJSON() }),
      newBlockId: block.id,
    };
  }

  static addPreset(design, preset) {
    const canvas = InvitationCanvas.fromDesign(design);
    const block = canvas.addPresetBlock(preset, design);
    return {
      design: new InvitationDesign({ ...design.toJSON(), textBlocks: canvas.toJSON() }),
      newBlockId: block.id,
    };
  }

  static bringForward(design, id) {
    return InvitationStudioService.updateBlocks(design, (c) => c.bringForward(id));
  }

  static sendBack(design, id) {
    return InvitationStudioService.updateBlocks(design, (c) => c.sendBack(id));
  }

  static addImage(design, src) {
    const images = [...(design.extraImages || [])];
    const image = {
      id: `img-${Date.now()}`,
      src,
      x: 50,
      y: 20,
      width: 32,
      height: 24,
      shape: 'round',
    };
    images.push(image);
    return {
      design: new InvitationDesign({ ...design.toJSON(), extraImages: images }),
      imageId: image.id,
    };
  }

  static moveImage(design, id, x, y) {
    const images = (design.extraImages || []).map((img) => (
      img.id === id ? { ...img, x, y } : img
    ));
    return new InvitationDesign({ ...design.toJSON(), extraImages: images });
  }

  static updateImage(design, id, props) {
    const images = (design.extraImages || []).map((img) => (
      img.id === id ? { ...img, ...props } : img
    ));
    return new InvitationDesign({ ...design.toJSON(), extraImages: images });
  }

  static removeImage(design, id) {
    const images = (design.extraImages || []).filter((img) => img.id !== id);
    return new InvitationDesign({ ...design.toJSON(), extraImages: images });
  }

  static duplicateBlock(design, id) {
    const canvas = InvitationCanvas.fromDesign(design);
    const copy = canvas.duplicateBlock(id);
    return {
      design: new InvitationDesign({ ...design.toJSON(), textBlocks: canvas.toJSON() }),
      newBlockId: copy?.id || null,
    };
  }

  static removeBlock(design, id) {
    return InvitationStudioService.updateBlocks(design, (c) => c.removeBlock(id));
  }

  static rebuildLayout(design) {
    const next = new InvitationDesign(design.toJSON());
    next.textBlocks = buildDefaultBlocks(next, next.template).map((b) => b.toJSON());
    return next;
  }

  static async save(design) {
    const data = { ...design.toJSON(), updatedAt: new Date().toISOString() };
    await saveInvitation(data);
    return data;
  }

  static exportPdf(design) {
    if (!design) return;
    const html = buildInvitationExportHtml(design);
    const w = window.open('', '_blank');
    if (!w) {
      window.alert('Please allow pop-ups to download your invitation.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }
}
