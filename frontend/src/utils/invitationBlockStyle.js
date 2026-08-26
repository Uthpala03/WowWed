import { fontOptions } from '../models/InvitationTemplate';

function isLightHex(color) {
  const hex = String(color || '').replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 175;
}

/** Shared block positioning — used by canvas editor and PDF export so they match exactly. */
export function getInvitationBlockStyle(block, cardWidth, livePos = null) {
  const scale = cardWidth / 400;
  const x = livePos?.x ?? block.x;
  const y = livePos?.y ?? block.y;
  const color = block.color || '#2c2416';
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: 'max-content',
    maxWidth: `${block.width}%`,
    fontFamily: fontOptions.find((f) => f.id === block.fontId)?.family || 'Georgia, serif',
    fontSize: `${block.fontSize * scale}px`,
    color,
    textAlign: block.align || 'center',
    fontStyle: block.italic ? 'italic' : 'normal',
    fontWeight: block.bold ? '700' : 'normal',
    textTransform: block.uppercase ? 'uppercase' : 'none',
    letterSpacing: block.letterSpacing != null
      ? `${block.letterSpacing}em`
      : (block.uppercase ? '0.08em' : 'normal'),
    lineHeight: String(block.lineHeight != null ? block.lineHeight : 1.25),
    zIndex: String(block.zIndex || 2),
    textShadow: isLightHex(color)
      ? '0 1px 3px rgba(0,0,0,0.55), 0 0 10px rgba(0,0,0,0.28)'
      : '0 1px 2px rgba(255,255,255,0.92), 0 0 8px rgba(255,255,255,0.55)',
  };
}

export function blockStyleToCss(styleObj) {
  return Object.entries(styleObj)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`)
    .join(';');
}

export function getBlockStyleString(block, cardWidth) {
  return blockStyleToCss({
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: '0',
    padding: '1px 3px',
    ...getInvitationBlockStyle(block, cardWidth),
  });
}
