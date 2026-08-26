import { getBlockStyleString } from './invitationBlockStyle';
import { getCardSize, invitationTemplates } from '../models/InvitationTemplate';

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@500;600;700&family=Dancing+Script:wght@500;600;700&family=Great+Vibes&family=Lato:wght@400;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@500;600;700&family=Tangerine:wght@400;700&display=swap';

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toAbsoluteUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (url.startsWith('/')) return `${origin}${url}`;
  return `${origin}/${url.replace(/^\//, '')}`;
}

/** Build print-ready HTML — one page, card only, no extra white border. */
export function buildInvitationExportHtml(design) {
  const template = invitationTemplates.getById(design.template);
  const size = getCardSize(design.cardSize);
  const showArt = design.showDecorations !== false && template.decorImage;
  const artSrc = toAbsoluteUrl(template.decorImage);
  const blocks = (design.textBlocks || []).filter((b) => b.text?.trim());

  const blocksHtml = blocks
    .map((block) => `<div style="${getBlockStyleString(block, size.width)}">${escapeHtml(block.text)}</div>`)
    .join('\n');

  const imagesHtml = (design.extraImages || [])
    .filter((img) => img.src)
    .map((img) => {
      const radius = img.shape === 'round' ? '50%' : '10px';
      return `<img src="${toAbsoluteUrl(img.src)}" alt="" style="position:absolute;left:${img.x}%;top:${img.y}%;width:${img.width}%;height:${img.height}%;transform:translate(-50%,-50%);object-fit:cover;border-radius:${radius};z-index:1;box-shadow:0 4px 16px rgba(0,0,0,0.18);" />`;
    })
    .join('\n');

  const artHtml = showArt
    ? `<img src="${artSrc}" alt="" class="invite-export-art" />`
    : '';

  const cardBg = showArt ? 'transparent' : '#fffef9';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Wedding Invitation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="${FONT_LINK}" />
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: ${size.width}px;
      height: ${size.height}px;
      overflow: hidden;
      background: ${cardBg};
    }

    .export-tip {
      position: fixed;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99;
      max-width: 90vw;
      padding: 8px 14px;
      border-radius: 10px;
      background: rgba(255, 245, 239, 0.97);
      border: 1px solid #f0d8cc;
      font: 12px/1.4 system-ui, sans-serif;
      color: #5c3d2e;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }

    .invite-export-card {
      position: relative;
      width: ${size.width}px;
      height: ${size.height}px;
      overflow: hidden;
      background: ${cardBg};
    }

    .invite-export-art {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
      z-index: 0;
      display: block;
    }

    .invite-export-layer {
      position: absolute;
      inset: 0;
      z-index: 1;
    }

    /* Page = card exactly — no white margins around the invitation */
    @page {
      size: ${size.width}px ${size.height}px;
      margin: 0;
    }

    @media print {
      .export-tip { display: none !important; }

      html, body {
        width: ${size.width}px;
        height: ${size.height}px;
        margin: 0 !important;
        padding: 0 !important;
      }

      .invite-export-card {
        width: ${size.width}px;
        height: ${size.height}px;
        page-break-after: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <p class="export-tip">
    Save as PDF: <strong>Margins → None</strong> · <strong>Scale → 100%</strong> · turn off <strong>Headers &amp; footers</strong>
  </p>
  <div class="invite-export-card">
    ${artHtml}
    <div class="invite-export-layer">
      ${imagesHtml}
      ${blocksHtml}
    </div>
  </div>
  <script>
    (function () {
      function ready() {
        var imgs = Array.prototype.slice.call(document.images);
        var waits = imgs.filter(function (img) { return !img.complete; }).map(function (img) {
          return new Promise(function (resolve) {
            img.onload = img.onerror = resolve;
          });
        });
        if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
        return Promise.all(waits);
      }
      ready().then(function () {
        setTimeout(function () { window.focus(); window.print(); }, 400);
      });
    })();
  </script>
</body>
</html>`;
}
