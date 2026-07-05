import { fontOptions } from '../models/InvitationTemplate';

/** Shared block positioning — used by canvas editor and PDF export so they match exactly. */
export function getInvitationBlockStyle(block, cardWidth, livePos = null) {
  const scale = cardWidth / 400;
  const x = livePos?.x ?? block.x;
  const y = livePos?.y ?? block.y;
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${block.width}%`,
    fontFamily: fontOptions.find((f) => f.id === block.fontId)?.family || 'Georgia, serif',
    fontSize: `${block.fontSize * scale}px`,
    color: block.color,
    textAlign: block.align || 'center',
    fontStyle: block.italic ? 'italic' : 'normal',
    fontWeight: block.bold ? '700' : 'normal',
    textTransform: block.uppercase ? 'uppercase' : 'none',
    letterSpacing: block.uppercase ? '0.08em' : 'normal',
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
    lineHeight: '1.35',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: '0',
    padding: '2px 4px',
    textShadow: '0 1px 2px rgba(255,255,255,0.95), 0 0 12px rgba(255,255,255,0.75), 0 0 24px rgba(255,255,255,0.4)',
    zIndex: '2',
    ...getInvitationBlockStyle(block, cardWidth),
  });
}
