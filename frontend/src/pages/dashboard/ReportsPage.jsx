import {
  getBudget,
  getGuests,
  getSeating,
  getTasks,
  getWeddingProfile,
  getBookings,
  getCrew,
  getProfileBudget,
  getOnboarding,
} from '../../utils/storage';
import { computeReadiness } from '../../utils/readiness';
import { displayStatus, isPaid } from '../../utils/bookingStatus';
import { getSuiteMeta } from '../../models/Seating';
import { normalizeRsvp } from '../../utils/guestRsvp';
import { normalizeGuestGroup } from '../../data/dashboardData';
import PageHeader from '../../components/ui/PageHeader';

const reportTypes = [
  { id: 'guests', title: 'Guest List Report', desc: 'All guests with RSVP status and groups' },
  { id: 'budget', title: 'Budget Report', desc: 'Planned vs actual spending by category' },
  { id: 'vendors', title: 'Vendor Report', desc: 'Booking requests and vendor expenses' },
  { id: 'seating', title: 'Seating Chart', desc: 'Printable Find Your Seat chart with every table' },
  { id: 'summary', title: 'Full Wedding Summary', desc: 'Complete overview of your wedding plan' },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '—';
  const raw = String(value).slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return escapeHtml(raw);
  return escapeHtml(parsed.toLocaleDateString('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }));
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const diff = new Date(dateString) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function reportStyles() {
  return `
    body { font-family: Georgia, 'Times New Roman', serif; padding: 36px 44px; color: #5c3d2e; line-height: 1.45; }
    h1 { color: #8b5a3c; margin: 0 0 0.25rem; font-size: 1.75rem; }
    h2 { color: #8b5a3c; margin: 1.6rem 0 0.55rem; font-size: 1.15rem; border-bottom: 1px solid #e8ddd4; padding-bottom: 0.3rem; }
    h3 { color: #6b4a38; margin: 1rem 0 0.4rem; font-size: 1rem; }
    p, li { margin: 0.25rem 0; }
    .meta { color: #7a6356; margin: 0 0 0.75rem; }
    hr { border: none; border-top: 1px solid #e0d4c8; margin: 0.75rem 0 1.1rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.5rem 0 1rem; font-size: 0.92rem; }
    th, td { border: 1px solid #e0d4c8; padding: 0.4rem 0.55rem; text-align: left; vertical-align: top; }
    th { background: #f7f1eb; color: #6b4a38; font-weight: 600; }
    td.num, th.num { text-align: right; white-space: nowrap; }
    .muted { color: #8a7268; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem 1.25rem; margin: 0.5rem 0 1rem; }
    .grid div { border-bottom: 1px solid #f0e8e0; padding: 0.3rem 0; }
    .grid small { display: block; color: #8a7268; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em; }
    .grid strong { font-size: 0.95rem; }
    .stat-row { margin: 0.35rem 0; }
    .table-block { margin: 0.75rem 0 1.1rem; page-break-inside: avoid; }
    .table-block h3 { margin-bottom: 0.25rem; }
    .guest-chip { display: inline-block; margin: 0.15rem 0.35rem 0.15rem 0; padding: 0.1rem 0.4rem; background: #f7f1eb; border-radius: 4px; font-size: 0.85rem; }

    /* Elegant Find Your Seat chart */
    body.seat-chart-page { padding: 28px 32px 40px; color: #3d3d3d; }
    .seat-chart { max-width: 980px; margin: 0 auto; text-align: center; }
    .seat-chart__monogram {
      width: 72px; height: 72px; margin: 0 auto 0.85rem;
      border: 1.5px solid #8a7268; border-radius: 50%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-family: Georgia, 'Times New Roman', serif; color: #5c3d2e; line-height: 1.1;
      position: relative;
    }
    .seat-chart__monogram::before {
      content: ''; position: absolute; inset: 5px; border: 1px solid #d4c4b8; border-radius: 50%;
    }
    .seat-chart__monogram span { font-size: 1.05rem; letter-spacing: 0.08em; font-weight: 600; }
    .seat-chart__names {
      margin: 0 0 0.35rem; font-size: 0.95rem; letter-spacing: 0.22em;
      text-transform: uppercase; color: #5c3d2e; font-weight: 600;
    }
    .seat-chart__title {
      margin: 0 0 0.25rem; font-size: 2rem; letter-spacing: 0.28em;
      text-transform: uppercase; color: #2f2f2f; font-weight: 600;
    }
    .seat-chart__date {
      margin: 0 0 1.6rem; font-size: 0.85rem; letter-spacing: 0.12em;
      text-transform: uppercase; color: #8a7268;
    }
    .seat-chart__grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.6rem 1.25rem;
      text-align: center;
    }
    .seat-card { page-break-inside: avoid; padding: 0.15rem 0.35rem; }
    .seat-card__label {
      margin: 0; font-size: 0.78rem; letter-spacing: 0.18em;
      text-transform: uppercase; color: #3d3d3d; font-weight: 600;
    }
    .seat-card__rule {
      display: flex; align-items: center; justify-content: center; gap: 0.35rem;
      margin: 0.35rem auto 0.55rem; max-width: 120px;
    }
    .seat-card__rule span {
      flex: 1; height: 1px; background: #3d3d3d; opacity: 0.55;
    }
    .seat-card__rule::before,
    .seat-card__rule::after {
      content: '‹'; font-size: 0.7rem; line-height: 1; color: #3d3d3d; opacity: 0.7;
      transform: scaleX(1.4);
    }
    .seat-card__rule::after { content: '›'; }
    .seat-card__guests {
      list-style: none; margin: 0; padding: 0;
      font-size: 0.82rem; line-height: 1.55; color: #4a4a4a;
    }
    .seat-card__guests li { margin: 0; }
    .seat-card__empty { color: #a09088; font-style: italic; font-size: 0.8rem; }
    .seat-card__suite {
      margin: 0.15rem 0 0; font-size: 0.65rem; letter-spacing: 0.08em;
      text-transform: uppercase; color: #8a7268;
    }
    .seat-card__mix {
      margin: 0.1rem 0 0.35rem; font-size: 0.62rem; letter-spacing: 0.02em;
      color: #a09088; text-transform: none;
    }
    .seat-chart__summary {
      margin: 1.75rem auto 0; max-width: 640px; text-align: left;
      border-top: 1px solid #e0d4c8; padding-top: 1rem;
    }
    @media print {
      body { padding: 16px 20px; }
      body.seat-chart-page { padding: 18px 20px; }
      h2 { page-break-after: avoid; }
      .table-block, tr, .seat-card { page-break-inside: avoid; }
      .seat-chart__grid { gap: 1.25rem 0.9rem; }
    }
    @media (max-width: 900px) {
      .seat-chart__grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 640px) {
      .seat-chart__grid { grid-template-columns: repeat(2, 1fr); }
      .seat-chart__title { font-size: 1.45rem; letter-spacing: 0.18em; }
    }
  `;
}

function categoryName(budget, categoryId) {
  return (budget.categories || []).find((c) => c.id === categoryId)?.name || 'Uncategorised';
}

function spentInCategory(budget, categoryId, hiredBookings) {
  const fromExpenses = (budget.expenses || [])
    .filter((item) => item.categoryId === categoryId)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const cat = (budget.categories || []).find((item) => item.id === categoryId);
  const fromHires = (hiredBookings || [])
    .filter((booking) => {
      const already = (budget.expenses || []).some(
        (item) => item.bookingId === booking.id || item.id === `hire-${booking.id}`,
      );
      if (already || !cat) return false;
      return String(booking.category || 'Vendors').toLowerCase() === String(cat.name).toLowerCase();
    })
    .reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  return fromExpenses + fromHires;
}

function totalSpent(budget, hiredBookings) {
  const expenseTotal = (budget.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const missingHires = (hiredBookings || []).filter((b) => !(budget.expenses || []).some(
    (e) => e.bookingId === b.id || e.id === `hire-${b.id}`,
  ));
  return expenseTotal + missingHires.reduce((s, b) => s + Number(b.amount || 0), 0);
}

function guestMap(guests) {
  const map = new Map();
  (guests || []).forEach((g) => {
    if (g?.id) map.set(g.id, g);
  });
  return map;
}

function buildGuestSection(guests) {
  // Keep guest list format unchanged — couples rely on this layout.
  let body = '<h2>Guests</h2><table border="1" cellpadding="6"><tr><th>Name</th><th>Group</th><th>RSVP</th></tr>';
  if (!guests.length) body += '<tr><td colspan="3">No guests yet</td></tr>';
  guests.forEach((g) => {
    body += `<tr><td>${escapeHtml(g.name)}</td><td>${escapeHtml(g.group)}</td><td>${escapeHtml(g.rsvp)}</td></tr>`;
  });
  body += '</table>';
  return body;
}

function buildBudgetSection(budget, profileBudget, hiredBookings, includeScenarios = true) {
  const total = Number(profileBudget || budget.total || 0);
  const spent = totalSpent(budget, hiredBookings);
  const remaining = total - spent;
  const categories = budget.categories || [];
  const expenses = budget.expenses || [];
  const scenarios = budget.savedScenarios || [];
  const confirmedId = budget.confirmedScenarioId;

  let html = '<h2>Budget</h2>';
  html += `<div class="grid">
    <div><small>Your budget</small><strong>${money(total)}</strong></div>
    <div><small>Spent</small><strong>${money(spent)}</strong></div>
    <div><small>Remaining</small><strong>${money(remaining)}</strong></div>
    <div><small>Utilisation</small><strong>${total ? Math.round((spent / total) * 100) : 0}%</strong></div>
  </div>`;

  html += '<h3>Spending by category</h3>';
  html += '<table><tr><th>Category</th><th class="num">Allocated</th><th class="num">Spent</th><th class="num">Remaining</th></tr>';
  if (!categories.length) {
    html += '<tr><td colspan="4" class="muted">No budget categories yet</td></tr>';
  } else {
    categories.forEach((cat) => {
      const allocated = Number(cat.allocated) || 0;
      const catSpent = spentInCategory(budget, cat.id, hiredBookings);
      html += `<tr>
        <td>${escapeHtml(cat.name)}</td>
        <td class="num">${money(allocated)}</td>
        <td class="num">${money(catSpent)}</td>
        <td class="num">${money(allocated - catSpent)}</td>
      </tr>`;
    });
  }
  html += '</table>';

  html += '<h3>Expenses & payments</h3>';
  html += '<table><tr><th>Date</th><th>Item</th><th>Category</th><th class="num">Amount</th><th>Notes</th></tr>';
  const paymentRows = [
    ...expenses.map((e) => ({
      date: e.date,
      name: e.name,
      category: categoryName(budget, e.categoryId),
      amount: Number(e.amount) || 0,
      notes: e.notes || '',
    })),
    ...(hiredBookings || [])
      .filter((b) => !(expenses || []).some((e) => e.bookingId === b.id || e.id === `hire-${b.id}`))
      .map((b) => ({
        date: b.updatedAt || b.createdAt || '',
        name: b.vendorName || 'Vendor hire',
        category: b.category || 'Vendors',
        amount: Number(b.amount) || 0,
        notes: 'Hired vendor',
      })),
  ].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  if (!paymentRows.length) {
    html += '<tr><td colspan="5" class="muted">No expenses recorded yet</td></tr>';
  } else {
    paymentRows.forEach((row) => {
      html += `<tr>
        <td>${formatDate(row.date)}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.category)}</td>
        <td class="num">${money(row.amount)}</td>
        <td>${escapeHtml(row.notes)}</td>
      </tr>`;
    });
  }
  html += '</table>';

  if (includeScenarios && scenarios.length) {
    html += '<h3>Saved budget plans</h3>';
    html += '<table><tr><th>Plan</th><th class="num">Estimate</th><th>Range</th><th>Status</th></tr>';
    scenarios.forEach((s) => {
      const confirmed = s.id === confirmedId ? 'Confirmed plan' : 'Saved';
      html += `<tr>
        <td>${escapeHtml(s.name)}</td>
        <td class="num">${money(s.estimate)}</td>
        <td>${money(s.low)} – ${money(s.high)}</td>
        <td>${escapeHtml(confirmed)}</td>
      </tr>`;
    });
    html += '</table>';

    const confirmed = scenarios.find((s) => s.id === confirmedId) || scenarios[scenarios.length - 1];
    const lines = confirmed?.lineItems || confirmed?.categories || [];
    if (lines.length) {
      html += `<h3>Cost breakdown — ${escapeHtml(confirmed.name)}</h3>`;
      html += '<table><tr><th>Item</th><th class="num">Amount</th></tr>';
      lines.forEach((row) => {
        html += `<tr><td>${escapeHtml(row.name)}</td><td class="num">${money(row.amount)}</td></tr>`;
      });
      html += '</table>';
    }
  }

  return html;
}

function buildVendorSection(bookings) {
  const list = bookings || [];
  const hired = list.filter((b) => isPaid(b.status));
  const totalQuoted = list.reduce((s, b) => s + Number(b.amount || 0), 0);
  const hiredTotal = hired.reduce((s, b) => s + Number(b.amount || 0), 0);

  let html = '<h2>Vendor Bookings</h2>';
  html += `<div class="grid">
    <div><small>Total bookings</small><strong>${list.length}</strong></div>
    <div><small>Booked / hired</small><strong>${hired.length}</strong></div>
    <div><small>Quoted total</small><strong>${money(totalQuoted)}</strong></div>
    <div><small>Hired total</small><strong>${money(hiredTotal)}</strong></div>
  </div>`;

  html += '<table><tr><th>Vendor</th><th>Category</th><th>Status</th><th class="num">Amount</th><th>Date</th><th>Notes</th></tr>';
  if (!list.length) {
    html += '<tr><td colspan="6" class="muted">No vendor bookings yet</td></tr>';
  } else {
    [...list]
      .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))
      .forEach((b) => {
        html += `<tr>
          <td>${escapeHtml(b.vendorName || 'Vendor')}</td>
          <td>${escapeHtml(b.category || '—')}</td>
          <td>${escapeHtml(displayStatus(b.status) || b.status || '—')}</td>
          <td class="num">${money(b.amount)}</td>
          <td>${formatDate(b.eventDate || b.date || b.updatedAt || b.createdAt)}</td>
          <td>${escapeHtml(b.notes || b.message || '')}</td>
        </tr>`;
      });
  }
  html += '</table>';
  return html;
}

function sortTables(tables) {
  return [...(tables || [])].sort((a, b) => {
    const an = String(a.name || '');
    const bn = String(b.name || '');
    const anum = Number(an.replace(/\D+/g, ''));
    const bnum = Number(bn.replace(/\D+/g, ''));
    if (Number.isFinite(anum) && Number.isFinite(bnum) && anum !== bnum) return anum - bnum;
    return an.localeCompare(bn, undefined, { numeric: true });
  });
}

function tableGuests(table, assignments, byId) {
  const seats = Number(table.seats) || 0;
  const seated = [];
  for (let i = 0; i < seats; i += 1) {
    const guestId = assignments[`${table.id}-${i}`];
    const guest = guestId ? byId.get(guestId) : null;
    if (guest) seated.push(guest);
  }
  return seated;
}

/** Label from who is actually seated (optimization), not the default suite. */
function tableOptimizationLabel(seatedGuests, table) {
  const counts = new Map();
  seatedGuests.forEach((guest) => {
    const group = normalizeGuestGroup(guest.group);
    if (!group || group === 'No Group') return;
    counts.set(group, (counts.get(group) || 0) + 1);
  });

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (ranked.length) {
    const total = seatedGuests.length || 1;
    const [top, second] = ranked;
    if (!second || top[1] === total || top[1] / total >= 0.7) {
      return {
        label: top[0],
        detail: ranked.map(([name, count]) => `${name} ${count}`).join(' · '),
      };
    }
    return {
      label: `${top[0]} + ${second[0]}`,
      detail: ranked.map(([name, count]) => `${name} ${count}`).join(' · '),
    };
  }

  if (table?.guestGroups?.[0]) {
    return { label: normalizeGuestGroup(table.guestGroups[0]), detail: '' };
  }

  const suite = getSuiteMeta(table?.suite);
  if (suite?.id && suite.id !== 'general') {
    return { label: suite.label, detail: '' };
  }

  return { label: seatedGuests.length ? 'Mixed' : 'Open', detail: '' };
}

function buildFindYourSeatChart(profile, onboarding, seating, guests, { includeDetail = false } = {}) {
  const tables = sortTables(seating?.tables || []);
  const assignments = seating?.assignments || {};
  const byId = guestMap(guests);
  const partnerOne = profile?.partnerOne || 'Partner 1';
  const partnerTwo = profile?.partnerTwo || 'Partner 2';
  const initialOne = String(partnerOne).trim().charAt(0).toUpperCase() || 'W';
  const initialTwo = String(partnerTwo).trim().charAt(0).toUpperCase() || 'W';
  const weddingDate = profile?.weddingDate || onboarding?.weddingDate;

  let capacity = 0;
  let assignedSeats = 0;
  tables.forEach((table) => {
    const seats = Number(table.seats) || 0;
    capacity += seats;
    assignedSeats += tableGuests(table, assignments, byId).length;
  });

  const coming = (guests || []).filter((g) => normalizeRsvp(g.rsvp) === 'Accepted');
  const seatedIds = new Set(Object.values(assignments).filter(Boolean));
  const unseated = coming.filter((g) => !seatedIds.has(g.id));

  let html = `<section class="seat-chart">
    <div class="seat-chart__monogram" aria-hidden="true">
      <span>${escapeHtml(initialOne)}</span>
      <span>${escapeHtml(initialTwo)}</span>
    </div>
    <p class="seat-chart__names">${escapeHtml(partnerOne)} &amp; ${escapeHtml(partnerTwo)}</p>
    <h1 class="seat-chart__title">Find Your Seat</h1>
    <p class="seat-chart__date">${formatDate(weddingDate)} · ${tables.length} tables · ${assignedSeats} guests seated</p>`;

  if (!tables.length) {
    html += '<p class="seat-card__empty">No tables created yet. Build your seating chart first, then download again.</p></section>';
    return html;
  }

  html += '<div class="seat-chart__grid">';
  tables.forEach((table) => {
    const seats = Number(table.seats) || 0;
    const seated = tableGuests(table, assignments, byId);
    const opt = tableOptimizationLabel(seated, table);
    const label = String(table.name || '').match(/^\d+$/)
      ? `Table ${table.name}`
      : (String(table.name || '').toLowerCase().startsWith('table')
        ? String(table.name)
        : `Table ${table.name}`);

    html += `<article class="seat-card">
      <h2 class="seat-card__label">${escapeHtml(label.toUpperCase())}</h2>
      <div class="seat-card__rule" aria-hidden="true"><span></span></div>
      <p class="seat-card__suite">${escapeHtml(opt.label)} · ${seated.length}/${seats}</p>
      ${opt.detail && opt.detail !== opt.label ? `<p class="seat-card__mix">${escapeHtml(opt.detail)}</p>` : ''}
      <ul class="seat-card__guests">
        ${
          seated.length
            ? seated.map((g) => `<li>${escapeHtml(g.name)}</li>`).join('')
            : '<li class="seat-card__empty">Open seats</li>'
        }
      </ul>
    </article>`;
  });
  html += '</div>';

  if (includeDetail) {
    html += `<div class="seat-chart__summary">
      <h2>Seating summary</h2>
      <div class="grid">
        <div><small>Tables</small><strong>${tables.length}</strong></div>
        <div><small>Seat capacity</small><strong>${capacity}</strong></div>
        <div><small>Seats assigned</small><strong>${assignedSeats}</strong></div>
        <div><small>Coming guests unseated</small><strong>${unseated.length}</strong></div>
      </div>`;

    if (unseated.length) {
      html += '<h3>Coming guests not yet seated</h3>';
      html += '<table><tr><th>Name</th><th>Group</th><th>RSVP</th></tr>';
      unseated.forEach((g) => {
        html += `<tr><td>${escapeHtml(g.name)}</td><td>${escapeHtml(g.group || '—')}</td><td>${escapeHtml(g.rsvp || 'Accepted')}</td></tr>`;
      });
      html += '</table>';
    }
    html += '</div>';
  }

  html += '</section>';
  return html;
}

function buildSeatingSection(seating, guests) {
  const tables = sortTables(seating?.tables || []);
  const assignments = seating?.assignments || {};
  const quality = seating?.mlQuality;
  const byId = guestMap(guests);

  let assignedSeats = 0;
  let capacity = 0;
  tables.forEach((table) => {
    const seats = Number(table.seats) || 0;
    capacity += seats;
    assignedSeats += tableGuests(table, assignments, byId).length;
  });

  const coming = (guests || []).filter((g) => normalizeRsvp(g.rsvp) === 'Accepted');
  const seatedIds = new Set(Object.values(assignments).filter(Boolean));
  const unseated = coming.filter((g) => !seatedIds.has(g.id));

  let html = '<h2>Seating</h2>';
  html += `<div class="grid">
    <div><small>Tables</small><strong>${tables.length}</strong></div>
    <div><small>Seat capacity</small><strong>${capacity}</strong></div>
    <div><small>Seats assigned</small><strong>${assignedSeats}</strong></div>
    <div><small>Coming guests unseated</small><strong>${unseated.length}</strong></div>
  </div>`;

  if (quality) {
    html += '<h3>Smart seating quality</h3>';
    html += `<div class="grid">
      <div><small>Seating accuracy</small><strong>${quality.seatingAccuracy != null ? `${quality.seatingAccuracy}%` : (quality.silhouette ?? '—')}</strong></div>
      <div><small>Table-type accuracy</small><strong>${quality.labelAccuracy != null ? `${quality.labelAccuracy}%` : '—'}</strong></div>
      <div><small>Guests seated (ML)</small><strong>${quality.assigned ?? '—'} / ${quality.coming ?? '—'}</strong></div>
      <div><small>Capacity violations</small><strong>${quality.capacityViolations ?? 0}</strong></div>
    </div>`;
  }

  if (!tables.length) {
    html += '<p class="muted">No tables created yet.</p>';
    return html;
  }

  html += '<h3>Table chart</h3>';
  tables.forEach((table) => {
    const seats = Number(table.seats) || 0;
    const seated = tableGuests(table, assignments, byId);
    const opt = tableOptimizationLabel(seated, table);
    html += `<div class="table-block">
      <h3>Table ${escapeHtml(table.name)} · ${escapeHtml(opt.label)} · ${seated.length}/${seats} seated</h3>
      <p class="muted">${escapeHtml(table.shape || 'round')} · priority ${escapeHtml(table.priority ?? '—')}${
        opt.detail ? ` · ${escapeHtml(opt.detail)}` : ''
      }</p>
      <div>${
        seated.length
          ? seated.map((g) => `<span class="guest-chip">${escapeHtml(g.name)}${g.group ? ` · ${escapeHtml(normalizeGuestGroup(g.group) || g.group)}` : ''}</span>`).join('')
          : '<span class="muted">No guests assigned</span>'
      }</div>
    </div>`;
  });

  if (unseated.length) {
    html += '<h3>Coming guests not yet seated</h3>';
    html += '<table><tr><th>Name</th><th>Group</th><th>RSVP</th></tr>';
    unseated.forEach((g) => {
      html += `<tr><td>${escapeHtml(g.name)}</td><td>${escapeHtml(g.group || '—')}</td><td>${escapeHtml(g.rsvp || 'Accepted')}</td></tr>`;
    });
    html += '</table>';
  }

  return html;
}

function buildAnalyticsSection({
  profile,
  onboarding,
  guests,
  tasks,
  budget,
  bookings,
  seating,
  crew,
  profileBudget,
  hiredBookings,
}) {
  const readiness = computeReadiness({ tasks, guests, budget: { ...budget, total: profileBudget || budget.total } });
  const accepted = guests.filter((g) => normalizeRsvp(g.rsvp) === 'Accepted').length;
  const pending = guests.filter((g) => normalizeRsvp(g.rsvp) === 'Pending').length;
  const rejected = guests.filter((g) => normalizeRsvp(g.rsvp) === 'Rejected').length;
  const spent = totalSpent(budget, hiredBookings);
  const weddingDate = profile?.weddingDate || onboarding?.weddingDate;
  const countdown = daysUntil(weddingDate);
  const quality = seating?.mlQuality;

  let html = '<h2>Wedding overview</h2>';
  html += `<div class="grid">
    <div><small>Wedding date</small><strong>${formatDate(weddingDate)}${countdown != null ? ` · ${countdown} days` : ''}</strong></div>
    <div><small>District</small><strong>${escapeHtml(profile?.district || onboarding?.location || 'Not set')}</strong></div>
    <div><small>Ceremony</small><strong>${escapeHtml(profile?.ceremonyType || 'Not set')}</strong></div>
    <div><small>Scale</small><strong>${escapeHtml(profile?.scale ? String(profile.scale).replace(/^\w/, (c) => c.toUpperCase()) : 'Standard')}</strong></div>
    <div><small>Your budget</small><strong>${money(profileBudget)}</strong></div>
    <div><small>Readiness</small><strong>${escapeHtml(readiness.status?.label || '—')} · ${readiness.score}%</strong></div>
  </div>`;

  html += '<h3>Analytics dashboard</h3>';
  html += `<div class="grid">
    <div><small>Checklist</small><strong>${readiness.done} / ${tasks.length} done (${readiness.taskPct}%)</strong></div>
    <div><small>Guest list</small><strong>${guests.length} total · ${accepted} accepted · ${pending} pending · ${rejected} declined</strong></div>
    <div><small>Budget spent</small><strong>${money(spent)}${profileBudget ? ` of ${money(profileBudget)} (${readiness.budgetPct}%)` : ''}</strong></div>
    <div><small>Vendor bookings</small><strong>${bookings.length} · ${bookings.filter((b) => isPaid(b.status)).length} hired</strong></div>
    <div><small>Seating tables</small><strong>${(seating?.tables || []).length}${quality ? ` · ${quality.assigned || 0} seated` : ''}</strong></div>
    <div><small>Wedding crew</small><strong>${(crew || []).length} members</strong></div>
  </div>`;

  html += '<h3>RSVP breakdown</h3>';
  html += `<p class="stat-row">Accepted: <strong>${accepted}</strong> · Pending: <strong>${pending}</strong> · Declined: <strong>${rejected}</strong></p>`;

  html += '<h3>Checklist progress</h3>';
  html += `<p class="stat-row">${readiness.done} of ${tasks.length} tasks completed (${readiness.taskPct}%)</p>`;
  const openTasks = tasks.filter((t) => !t.done).slice(0, 12);
  if (openTasks.length) {
    html += '<table><tr><th>Open tasks</th><th>Due</th></tr>';
    openTasks.forEach((t) => {
      html += `<tr><td>${escapeHtml(t.title || t.name || 'Task')}</td><td>${formatDate(t.dueDate || t.due)}</td></tr>`;
    });
    html += '</table>';
  }

  if ((crew || []).length) {
    html += '<h3>Wedding crew</h3>';
    html += '<table><tr><th>Name</th><th>Role</th></tr>';
    crew.forEach((m) => {
      html += `<tr><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.role || '—')}</td></tr>`;
    });
    html += '</table>';
  }

  return html;
}

function buildReportHtml(type) {
  const profile = getWeddingProfile() || {};
  const onboarding = getOnboarding() || {};
  const guests = getGuests() || [];
  const budget = getBudget() || { total: 0, expenses: [], categories: [], savedScenarios: [] };
  const tasks = getTasks() || [];
  const seating = getSeating() || { tables: [], assignments: {} };
  const bookings = getBookings() || [];
  const crew = getCrew() || [];
  const profileBudget = getProfileBudget() || Number(profile?.budget) || Number(budget?.total) || 0;
  const hiredBookings = bookings.filter((b) => isPaid(b.status));
  const title = reportTypes.find((r) => r.id === type)?.title || 'Report';
  const couple = `${escapeHtml(profile.partnerOne || 'Partner 1')} & ${escapeHtml(profile.partnerTwo || 'Partner 2')}`;
  const date = escapeHtml(String(profile.weddingDate || onboarding.weddingDate || '').slice(0, 10));
  const bodyClass = type === 'seating' ? 'seat-chart-page' : '';

  // Dedicated elegant seating chart download
  if (type === 'seating') {
    const chart = buildFindYourSeatChart(profile, onboarding, seating, guests, { includeDetail: true });
    return `<html><head><title>${escapeHtml(title)}</title><style>${reportStyles()}</style></head><body class="${bodyClass}">${chart}</body></html>`;
  }

  let body = `<h1>WOWWED — ${escapeHtml(title)}</h1><p class="meta">${couple} · ${date}</p><hr/>`;

  if (type === 'guests') {
    body += buildGuestSection(guests);
  }

  if (type === 'budget') {
    body += buildBudgetSection(budget, profileBudget, hiredBookings, true);
  }

  if (type === 'vendors') {
    body += buildVendorSection(bookings);
  }

  if (type === 'summary') {
    body += buildAnalyticsSection({
      profile,
      onboarding,
      guests,
      tasks,
      budget,
      bookings,
      seating,
      crew,
      profileBudget,
      hiredBookings,
    });
    body += buildGuestSection(guests);
    body += buildBudgetSection(budget, profileBudget, hiredBookings, true);
    body += buildVendorSection(bookings);
    body += '<h2>Find Your Seat chart</h2>';
    body += buildFindYourSeatChart(profile, onboarding, seating, guests, { includeDetail: false });
    body += buildSeatingSection(seating, guests);
  }

  return `<html><head><title>${escapeHtml(title)}</title><style>${reportStyles()}</style></head><body class="${bodyClass}">${body}</body></html>`;
}

function ReportsPage() {
  const download = (type) => {
    const w = window.open('', '_blank');
    if (!w) {
      window.alert('Please allow pop-ups to print this report.');
      return;
    }
    w.document.write(buildReportHtml(type));
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="dash-page">
      <PageHeader moduleId="reports" title="PDF Reports" />
      <div className="reports-grid">
        {reportTypes.map((r) => (
          <article key={r.id} className="dash-card report-card">
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <button type="button" className="dash-btn dash-btn--primary" onClick={() => download(r.id)}>Download PDF</button>
          </article>
        ))}
      </div>
    </div>
  );
}

export default ReportsPage;
