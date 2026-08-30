/**
 * WowWed unit evidence runner.
 * From the WowWed folder in a VS Code terminal:
 *   node scripts/run_unit_evidence.js UT01
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function loadEsm(relFromSrc, exportNames, preamble = '') {
  const abs = path.join(ROOT, 'frontend', 'src', relFromSrc);
  let src = fs.readFileSync(abs, 'utf8');
  src = src.replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  src = src.replace(/export\s+\{[^}]*\};?/g, '');
  src = src.replace(/export\s+async\s+function/g, 'async function');
  src = src.replace(/export\s+function/g, 'function');
  src = src.replace(/export\s+class/g, 'class');
  src = src.replace(/export\s+const\s+(\w+)/g, 'const $1');
  const box = { exports: {} };
  const body = `${preamble}\n${src}\nmodule.exports = { ${exportNames.join(', ')} };`;
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', body);
  fn(box, box.exports, require, path.dirname(abs), abs);
  return box.exports;
}

function loadGuestGroup() {
  const abs = path.join(ROOT, 'frontend', 'src', 'data', 'dashboardData.js');
  const dash = fs.readFileSync(abs, 'utf8');
  const start = dash.indexOf('export const guestGroups');
  const end = dash.indexOf('export const rsvpStatuses');
  if (start < 0 || end < 0) throw new Error('Could not read normalizeGuestGroup from dashboardData.js');
  const chunk = dash
    .slice(start, end)
    .replace(/export\s+function/g, 'function')
    .replace(/export\s+const/g, 'const');
  const box = { exports: {} };
  const fn = new Function('module', 'exports', `${chunk}\nmodule.exports = { normalizeGuestGroup, guestGroups };`);
  fn(box, box.exports);
  return box.exports;
}

const guestRsvp = loadEsm('utils/guestRsvp.js', [
  'normalizeRsvp',
  'countRsvpAccepted',
  'resolveBudgetGuestCount',
  'rsvpGuestSummary',
]);
const userHome = loadEsm('utils/userHome.js', ['getUserHomePath']);
const budgetEngine = loadEsm('data/weddingBudgetEngine.js', ['calculateDetailedBudget']);
const bookingUi = loadEsm('utils/bookingStatus.js', [
  'canonicalizeStatus',
  'isPaid',
  'coupleCanHire',
  'coupleCanCancel',
]);
const { normalizeGuestGroup } = loadGuestGroup();
const seatingPreamble = `function normalizeGuestGroup(value) {
  if (!value) return 'No Group';
  return String(value).trim();
}`;
const seating = loadEsm('models/Seating.js', ['Table', 'SeatingChart'], seatingPreamble);

function loadOnboardingFns() {
  const abs = path.join(ROOT, 'backend', 'utils', 'onboardingWedding.js');
  const src = fs.readFileSync(abs, 'utf8');
  const start = src.indexOf('const ceremonyLabels');
  const end = src.indexOf('function parseOnboardingRow');
  const chunk = src.slice(start, end);
  const box = { exports: {} };
  const fn = new Function('module', 'exports', `${chunk}\nmodule.exports = { ceremonyFromOnboarding, districtFromLocation };`);
  fn(box, box.exports);
  return box.exports;
}

const onboarding = loadOnboardingFns();

function ok(pass, payload) {
  return { pass: Boolean(pass), ...payload };
}

const CASES = {
  'U-01': () => {
    const rsvp = guestRsvp.normalizeRsvp('yes');
    return ok(rsvp === 'Accepted', { rsvp });
  },
  'U-02': () => {
    const rsvp = guestRsvp.normalizeRsvp('no');
    return ok(rsvp === 'Rejected', { rsvp });
  },
  'U-03': () => {
    const rsvp = guestRsvp.normalizeRsvp('maybe');
    return ok(rsvp === 'Pending', { rsvp });
  },
  'U-04': () => {
    const guests = [
      { name: 'Amal', rsvp: 'Accepted' },
      { name: 'Nimali', rsvp: 'yes' },
      { name: 'Sahan', rsvp: 'Pending' },
    ];
    const accepted = guestRsvp.countRsvpAccepted(guests);
    return ok(accepted === 2, { accepted });
  },
  'U-05': () => {
    const guests = [{ name: 'Amal', rsvp: 'Accepted' }, { name: 'Nimali', rsvp: 'Pending' }];
    const count = guestRsvp.resolveBudgetGuestCount(guests, 200);
    return ok(count === 1, { count, reason: 'accepted RSVPs win over the planned profile count' });
  },
  'U-06': () => {
    const count = guestRsvp.resolveBudgetGuestCount([], 0);
    return ok(count === 150, { count, reason: 'empty list and no planned count defaults to 150' });
  },
  'U-07': () => {
    const table = new seating.Table({ id: 't1', name: 'Head table', seats: 25 });
    return ok(table.seats === 20, { seats: table.seats, reason: 'WowWed tables allow 1 to 20 seats' });
  },
  'U-08': () => {
    const table = new seating.Table({ id: 't1', name: 'Small table', seats: 0 });
    return ok(table.seats === 1, { seats: table.seats });
  },
  'U-09': () => {
    const chart = new seating.SeatingChart(
      { tables: [{ id: 't1', name: 'Table 1', seats: 8 }], assignments: {} },
      [{ id: 'g1', name: 'Amal Perera', rsvp: 'Accepted' }],
    );
    chart.assignGuest('t1', 0, 'g1');
    return ok(chart.assignments['t1-0'] === 'g1', { assignments: chart.assignments });
  },
  'U-10': () => {
    const chart = new seating.SeatingChart(
      { tables: [{ id: 't1', name: 'Table 1', seats: 8 }], assignments: { 't1-0': 'g1' } },
      [{ id: 'g1', name: 'Amal Perera', rsvp: 'Accepted' }],
    );
    chart.unassignGuest('g1');
    return ok(chart.assignments['t1-0'] == null, { assignments: chart.assignments });
  },
  'U-11': () => {
    const status = bookingUi.canonicalizeStatus('Accepted');
    return ok(status === 'Confirmed', { status });
  },
  'U-12': () => {
    const status = bookingUi.canonicalizeStatus('Hired');
    return ok(status === 'Paid', { status });
  },
  'U-13': () => {
    const paid = bookingUi.isPaid('Paid');
    return ok(paid === true, { paid });
  },
  'U-14': () => {
    const canHire = bookingUi.coupleCanHire('Pending');
    return ok(canHire === false, { canHire, reason: 'couple can hire only after the vendor accepts or counters' });
  },
  'U-15': () => {
    const canCancel = bookingUi.coupleCanCancel('Paid');
    return ok(canCancel === false, { canCancel, reason: 'paid bookings cannot be cancelled in the UI' });
  },
  'U-16': () => {
    const label = onboarding.ceremonyFromOnboarding('poruwa');
    return ok(label === 'Poruwa Ceremony', { ceremonyType: label });
  },
  'U-17': () => {
    const group = normalizeGuestGroup('bride family');
    return ok(group === "Bride's Family", { group });
  },
  'U-18': () => {
    const detail = budgetEngine.calculateDetailedBudget({
      guestCount: 150,
      district: 'Colombo',
      ceremonyType: 'Poruwa',
      scale: 'standard',
      drinksPackage: 'none',
      mealStyle: 'buffet',
      venueType: 'indoor',
    });
    const drinks = detail.lineItems.find((row) => row.id === 'drinks');
    return ok(!drinks, { drinksLine: drinks || null, lineIds: detail.lineItems.map((row) => row.id) });
  },
  'U-19': () => {
    const detail = budgetEngine.calculateDetailedBudget({
      guestCount: 10,
      district: 'Kandy',
      ceremonyType: 'Poruwa',
      scale: 'budget',
      mealStyle: 'basic',
      venueType: 'indoor',
    });
    return ok(detail.guests === 50, { guests: detail.guests, reason: 'engine clamps guest count to 50–800' });
  },
  'U-20': () => {
    const pathForVendor = userHome.getUserHomePath({ role: 'vendor' });
    const pathForCouple = userHome.getUserHomePath({ role: 'couple' });
    return ok(pathForVendor === '/vendor' && pathForCouple === '/dashboard', {
      vendorHome: pathForVendor,
      coupleHome: pathForCouple,
    });
  },
};

function printResult(id, result) {
  console.log(id);
  console.log(JSON.stringify(result, null, 2));
}

/** Accept UT01, UT-01, U-01, or U01. */
function normalizeCaseId(raw) {
  const compact = String(raw || '').toUpperCase().replace(/[\s_-]/g, '');
  const match = compact.match(/^(?:UT|U)(\d{1,2})$/);
  if (!match) return String(raw || '').toUpperCase();
  return `U-${match[1].padStart(2, '0')}`;
}

function displayId(internalId) {
  return internalId.replace(/^U-/, 'UT');
}

function main() {
  const raw = String(process.argv[2] || '');
  if (!raw || raw === '--list') {
    console.log(Object.keys(CASES).map(displayId).join('\n'));
    return;
  }
  const id = normalizeCaseId(raw);
  const run = CASES[id];
  if (!run) {
    console.error(`Unknown unit case ${raw}. Try UT01 to UT20.`);
    process.exit(1);
  }
  const result = run();
  printResult(displayId(id), result);
  process.exit(result.pass ? 0 : 1);
}

main();
