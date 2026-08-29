import { formatVendorCategories, formatVendorDistricts, vendorCategories, vendorDistricts } from './vendorMeta';
import { displayStatus, isPaid, vendorNeedsDecision, awaitingCouple } from './bookingStatus';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

function hasQuoteContent(q) {
  return Boolean(q?.title?.trim() || q?.price || q?.details?.trim() || q?.pdfUrl || q?.pdfData);
}

/** Listing strength from the logged-in vendor's saved profile. */
export function computeListingStrength(profile = {}) {
  const businessName = String(profile.businessName || profile.name || '').trim();
  const description = String(profile.description || '').trim();
  const categories = vendorCategories(profile);
  const districts = vendorDistricts(profile);
  const photos = profile.portfolioImages || [];
  const packages = (profile.quotations || []).filter(hasQuoteContent);
  const priceRange = String(profile.priceRange || '').trim();
  const contact = String(profile.ownerEmail || profile.email || profile.phone || '').trim();

  const checks = [
    { ok: businessName.length >= 2, label: 'Business name', hint: 'Add your public business name' },
    { ok: categories.length > 0, label: 'Service categories', hint: 'Choose at least one category' },
    { ok: districts.length > 0, label: 'Service districts', hint: 'Add where you operate' },
    { ok: description.length >= 40, label: 'Description', hint: 'Write at least a short about section' },
    { ok: Boolean(priceRange), label: 'Price range', hint: 'Set a price band for couples' },
    { ok: photos.length > 0, label: 'Photos', hint: 'Upload portfolio images' },
    { ok: packages.length > 0, label: 'Packages', hint: 'Add at least one package or quotation' },
    { ok: Boolean(contact), label: 'Contact details', hint: 'Keep your account email / contact available' },
  ];

  const done = checks.filter((item) => item.ok).length;
  return {
    checks,
    done,
    total: checks.length,
    pct: Math.round((done / checks.length) * 100),
    missing: checks.filter((item) => !item.ok),
    summary: {
      businessName: businessName || 'Your listing',
      categories: formatVendorCategories(profile),
      districts: formatVendorDistricts(profile),
      photoCount: photos.length,
      packageCount: packages.length,
    },
  };
}

function reportStyles() {
  return `
    body { font-family: Georgia, 'Times New Roman', serif; padding: 36px 44px; color: #5c3d2e; line-height: 1.45; }
    h1 { color: #8b5a3c; margin: 0 0 0.25rem; font-size: 1.75rem; }
    h2 { color: #8b5a3c; margin: 1.5rem 0 0.5rem; font-size: 1.1rem; border-bottom: 1px solid #e8ddd4; padding-bottom: 0.3rem; }
    .meta { color: #7a6356; margin: 0 0 0.75rem; }
    hr { border: none; border-top: 1px solid #e0d4c8; margin: 0.75rem 0 1.1rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.5rem 0 1rem; font-size: 0.92rem; }
    th, td { border: 1px solid #e0d4c8; padding: 0.4rem 0.55rem; text-align: left; vertical-align: top; }
    th { background: #f7f1eb; color: #6b4a38; font-weight: 600; }
    td.num, th.num { text-align: right; white-space: nowrap; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem 1.25rem; margin: 0.5rem 0 1rem; }
    .grid div { border-bottom: 1px solid #f0e8e0; padding: 0.3rem 0; }
    .grid small { display: block; color: #8a7268; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em; }
    .muted { color: #8a7268; }
    @media print { body { padding: 16px 20px; } tr { page-break-inside: avoid; } }
  `;
}

/** Printable PDF summary of all vendor bookings. */
export function buildVendorBookingSummaryHtml({ profile, bookings = [], user } = {}) {
  const businessName = profile?.businessName || profile?.name || user?.fullName || 'Vendor';
  const list = [...(bookings || [])].sort((a, b) => String(b.date || b.updatedAt || '').localeCompare(String(a.date || a.updatedAt || '')));
  const paid = list.filter((b) => isPaid(b.status));
  const needs = list.filter((b) => vendorNeedsDecision(b.status));
  const waiting = list.filter((b) => awaitingCouple(b.status) && !vendorNeedsDecision(b.status));
  const earnings = paid.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const quoted = list.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const generated = new Date().toLocaleString('en-LK');

  let body = `<h1>WOWWED — Vendor Booking Summary</h1>
    <p class="meta">${escapeHtml(businessName)} · ${escapeHtml(formatVendorCategories(profile))} · ${escapeHtml(formatVendorDistricts(profile))}</p>
    <p class="meta">Generated ${escapeHtml(generated)}${user?.email ? ` · ${escapeHtml(user.email)}` : ''}</p>
    <hr/>
    <h2>Overview</h2>
    <div class="grid">
      <div><small>Total bookings</small><strong>${list.length}</strong></div>
      <div><small>Needs reply</small><strong>${needs.length}</strong></div>
      <div><small>Awaiting couple</small><strong>${waiting.length}</strong></div>
      <div><small>Paid / booked</small><strong>${paid.length}</strong></div>
      <div><small>Quoted total</small><strong>${money(quoted)}</strong></div>
      <div><small>Earnings (paid)</small><strong>${money(earnings)}</strong></div>
    </div>
    <h2>All booking requests</h2>
    <table>
      <tr>
        <th>Couple</th>
        <th>Date</th>
        <th>Status</th>
        <th class="num">Amount</th>
        <th>Message / notes</th>
      </tr>`;

  if (!list.length) {
    body += '<tr><td colspan="5" class="muted">No bookings yet</td></tr>';
  } else {
    list.forEach((b) => {
      body += `<tr>
        <td>${escapeHtml(b.coupleName || 'Couple')}</td>
        <td>${escapeHtml(b.date || b.eventDate || '—')}</td>
        <td>${escapeHtml(displayStatus(b.status) || b.status || '—')}</td>
        <td class="num">${money(b.amount)}</td>
        <td>${escapeHtml(b.notes || b.message || b.coupleMessage || '')}</td>
      </tr>`;
    });
  }
  body += '</table>';

  if (paid.length) {
    body += '<h2>Paid bookings</h2><table><tr><th>Couple</th><th>Date</th><th class="num">Amount</th></tr>';
    paid.forEach((b) => {
      body += `<tr>
        <td>${escapeHtml(b.coupleName || 'Couple')}</td>
        <td>${escapeHtml(b.date || '—')}</td>
        <td class="num">${money(b.amount)}</td>
      </tr>`;
    });
    body += '</table>';
  }

  return `<html><head><title>Vendor Booking Summary</title><style>${reportStyles()}</style></head><body>${body}</body></html>`;
}

export function downloadVendorBookingSummaryPdf(args) {
  const w = window.open('', '_blank');
  if (!w) {
    window.alert('Please allow pop-ups to download this report.');
    return;
  }
  w.document.write(buildVendorBookingSummaryHtml(args));
  w.document.close();
  w.focus();
  w.print();
}
