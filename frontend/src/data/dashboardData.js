import { wowWedModules } from '../models/AppModule';
import { vendorCategories, vendorCategoryLabels } from '../models/VendorCategory';

export { vendorCategories, vendorCategoryLabels };

export const dashboardNav = wowWedModules.getDashboardNav().map((m) => m.toNavItem());
export const vendorNav = wowWedModules.getVendorNav().map((m) => m.toNavItem());
export const quickLinkHints = wowWedModules.getQuickLinkHints();

export const taskCategories = [
  { id: 'guests', label: 'Guests', icon: '👤' },
  { id: 'suite', label: 'Suite and Dress', icon: '👗' },
  { id: 'vendors', label: 'Vendors', icon: '🏪' },
  { id: 'ceremony', label: 'Ceremony', icon: '💍' },
  { id: 'catering', label: 'Catering', icon: '🍽️' },
  { id: 'decorations', label: 'Decorations', icon: '🌸' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎵' },
  { id: 'logistics', label: 'Logistics', icon: '🚗' },
  { id: 'budget', label: 'Budget', icon: '💰' },
  { id: 'venue', label: 'Venue', icon: '🏛️' },
  { id: 'other', label: 'Other', icon: '📌' },
];

export const guestGroups = [
  'No Group',
  "Bride's Family",
  "Groom's Family",
  "Bride's Friends",
  "Groom's Friends",
  "Bride's Colleagues",
  "Groom's Colleagues",
  'Relatives',
  'VIP',
  'Neighbours',
  'Other',
];

const guestGroupAliases = {
  family: 'Relatives',
  friends: 'Other',
  children: 'Other',
  child: 'Other',
  kids: 'Other',
  neighbors: 'Neighbours',
  neighbour: 'Neighbours',
  neighbor: 'Neighbours',
  relatives: 'Relatives',
  vip: 'VIP',
  other: 'Other',
  'no group': 'No Group',
  'bride family': "Bride's Family",
  "bride's family": "Bride's Family",
  'groom family': "Groom's Family",
  "groom's family": "Groom's Family",
  'bride friends': "Bride's Friends",
  "bride's friends": "Bride's Friends",
  'groom friends': "Groom's Friends",
  "groom's friends": "Groom's Friends",
  'bride colleagues': "Bride's Colleagues",
  "bride's colleagues": "Bride's Colleagues",
  'groom colleagues': "Groom's Colleagues",
  "groom's colleagues": "Groom's Colleagues",
};

const guestGroupTones = {
  'No Group': { bg: '#f4f1ee', color: '#7a6a60' },
  "Bride's Family": { bg: '#fff1e8', color: '#c45c26' },
  "Groom's Family": { bg: '#eef0ff', color: '#3949ab' },
  "Bride's Friends": { bg: '#fce4ec', color: '#ad1457' },
  "Groom's Friends": { bg: '#e3f2fd', color: '#1565c0' },
  "Bride's Colleagues": { bg: '#fff8e1', color: '#ef6c00' },
  "Groom's Colleagues": { bg: '#e0f2f1', color: '#00695c' },
  Relatives: { bg: '#f3e5f5', color: '#7b1fa2' },
  VIP: { bg: '#fff3e0', color: '#e65100' },
  Neighbours: { bg: '#e8f5e9', color: '#2e7d32' },
  Other: { bg: '#eceff1', color: '#546e7a' },
};

export function guestGroupTone(group) {
  const tone = guestGroupTones[group] || guestGroupTones.Other;
  return { background: tone.bg, color: tone.color };
}

export function normalizeGuestGroup(value) {
  if (!value) return 'No Group';
  const raw = String(value).trim();
  if (guestGroups.includes(raw)) return raw;
  const key = raw.toLowerCase().replace(/['’]/g, "'");
  if (guestGroupAliases[key]) return guestGroupAliases[key];
  if (key.includes('bride') && key.includes('famil')) return "Bride's Family";
  if (key.includes('groom') && key.includes('famil')) return "Groom's Family";
  if (key.includes('bride') && key.includes('friend')) return "Bride's Friends";
  if (key.includes('groom') && key.includes('friend')) return "Groom's Friends";
  if (key.includes('bride') && key.includes('colleague')) return "Bride's Colleagues";
  if (key.includes('groom') && key.includes('colleague')) return "Groom's Colleagues";
  if (key.includes('relative')) return 'Relatives';
  if (key.includes('neighbour') || key.includes('neighbor')) return 'Neighbours';
  if (key.includes('vip')) return 'VIP';
  return 'Other';
}

export const rsvpStatuses = ['Pending', 'Accepted', 'Rejected'];

export const crewRoles = [
  'Bridesmaid', 'Groomsman', 'Best Man', 'Maid of Honour',
  'Flower Girl', 'Ring Bearer', 'Helper', 'Coordinator',
];

export const tableShapes = [
  { id: 'round', label: 'Round', icon: '⭕' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'square', label: 'Square', icon: '⬜' },
  { id: 'head', label: 'Head Table', icon: '👑' },
  { id: 'standing', label: 'Standing', icon: '🧍' },
];

const taskTemplates = [
  { title: 'Pick shoes for groom and bride', category: 'suite', month: 6, year: 2027 },
  { title: 'Purchase wedding favors/gifts for guests', category: 'guests', month: 6, year: 2027 },
  { title: "Bride's clothing fitting", category: 'suite', month: 6, year: 2027 },
  { title: 'Book photo booth or entertainment extras', category: 'entertainment', month: 6, year: 2027 },
  { title: "Groom's clothing fitting", category: 'suite', month: 6, year: 2027 },
  { title: 'Book hair and makeup artist', category: 'suite', month: 2, year: 2027 },
  { title: 'Find people for Ashlaka and Jayamangala Gatha', category: 'ceremony', month: 3, year: 2027 },
  { title: 'Arrange transportation for guests', category: 'logistics', month: 7, year: 2027 },
  { title: 'Collect final RSVPs', category: 'guests', month: 7, year: 2027 },
  { title: 'Create your seating chart', category: 'guests', month: 7, year: 2027 },
  { title: 'Enjoy your wedding 🥳', category: 'other', month: 7, year: 2027 },
  { title: 'Plan your bar menu', category: 'catering', month: 7, year: 2026 },
  { title: 'Book wedding venue', category: 'venue', month: 1, year: 2027 },
  { title: 'Hire photographer and videographer', category: 'vendors', month: 1, year: 2027 },
  { title: 'Choose wedding theme and colours', category: 'decorations', month: 2, year: 2027 },
  { title: 'Send save-the-date cards', category: 'guests', month: 2, year: 2027 },
  { title: 'Book catering service', category: 'catering', month: 3, year: 2027 },
  { title: 'Order wedding cake', category: 'catering', month: 4, year: 2027 },
  { title: 'Book band or DJ', category: 'entertainment', month: 3, year: 2027 },
  { title: 'Arrange poruwa ceremony items', category: 'ceremony', month: 5, year: 2027 },
  { title: 'Book florist for decorations', category: 'decorations', month: 4, year: 2027 },
  { title: 'Plan honeymoon travel', category: 'logistics', month: 5, year: 2027 },
  { title: 'Set wedding budget categories', category: 'budget', month: 1, year: 2027 },
  { title: 'Order wedding invitations', category: 'guests', month: 3, year: 2027 },
  { title: 'Mail wedding invitations', category: 'guests', month: 4, year: 2027 },
  { title: 'Book hotel rooms for guests', category: 'logistics', month: 5, year: 2027 },
  { title: 'Arrange wedding rehearsal', category: 'ceremony', month: 6, year: 2027 },
  { title: 'Confirm vendor contracts', category: 'vendors', month: 5, year: 2027 },
  { title: 'Plan welcome drinks menu', category: 'catering', month: 6, year: 2027 },
  { title: 'Order bridal jewellery', category: 'suite', month: 4, year: 2027 },
  { title: 'Book mehendi artist', category: 'suite', month: 5, year: 2027 },
  { title: 'Arrange lighting for venue', category: 'decorations', month: 6, year: 2027 },
  { title: 'Create day-of timeline', category: 'logistics', month: 6, year: 2027 },
  { title: 'Confirm final headcount with caterer', category: 'catering', month: 7, year: 2027 },
  { title: 'Pack emergency wedding kit', category: 'other', month: 7, year: 2027 },
  { title: 'Write wedding vows', category: 'ceremony', month: 6, year: 2027 },
  { title: 'Book officiant or registrar', category: 'ceremony', month: 2, year: 2027 },
  { title: 'Choose wedding rings', category: 'ceremony', month: 3, year: 2027 },
  { title: 'Plan bridal shower', category: 'guests', month: 4, year: 2027 },
  { title: 'Plan bachelor party', category: 'guests', month: 5, year: 2027 },
];

function padDate(month, year) {
  const day = 7 + (month % 3);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildDefaultTasks() {
  const tasks = taskTemplates.map((t, i) => ({
    id: `t${i + 1}`,
    title: t.title,
    category: t.category,
    dueDate: padDate(t.month, t.year),
    done: false,
    assigned: 'Unassigned',
    notes: '',
  }));

  const extras = [
    'Confirm table linens', 'Order guest book', 'Arrange parking', 'Book makeup trial',
    'Schedule dress fitting', 'Choose groomsmen suits', 'Plan first dance song',
    'Create playlist for reception', 'Book string quartet', 'Arrange confetti exit',
    'Order place cards', 'Plan thank-you cards', 'Confirm hair trial date',
    'Book pre-wedding shoot', 'Arrange welcome bags', 'Plan cocktail hour menu',
    'Confirm ceremony readings', 'Choose flower girl basket', 'Plan ring bearer pillow',
    'Arrange guest shuttle', 'Confirm cake tasting', 'Book dessert table',
    'Plan kids entertainment', 'Arrange photo backdrop', 'Confirm venue setup time',
    'Plan bridal party gifts', 'Arrange morning-of breakfast', 'Confirm tipping budget',
    'Plan post-wedding brunch', 'Backup plan for rain',
  ];

  extras.forEach((title, i) => {
    const month = (i % 6) + 2;
    tasks.push({
      id: `t${tasks.length + 1}`,
      title,
      category: taskCategories[i % taskCategories.length].id,
      dueDate: padDate(month, 2027),
      done: false,
      assigned: 'Unassigned',
      notes: '',
    });
  });

  return tasks;
}

export const defaultTasks = buildDefaultTasks();

export const defaultGuests = [];

export const defaultVendors = [
  { id: 'vw-01', name: 'Kandyan Reach Hotel', category: 'Venue & Res. Halls', city: 'Kurunegala', spotlight: true },
  { id: 'vw-36', name: 'Seethawaka Regency', category: 'Venue & Res. Halls', city: 'Avissawella', spotlight: true },
  { id: 'vw-34', name: 'Clover Banquets & Resorts', category: 'Venue & Res. Halls', city: 'Kelaniya', spotlight: true },
  { id: 'vw-39', name: 'AVANI Kalutara Resort', category: 'Venue & Res. Halls', city: 'Kalutara', spotlight: true },
  { id: 'vw-17', name: 'Romance Wedding Photography', category: 'Photography & Videography', city: 'Colombo', spotlight: true },
  { id: 'vw-49', name: 'Brides Mark', category: 'Bridal Service', city: 'Yakkala', spotlight: true },
  { id: 'vw-59', name: 'Swarnamahal', category: 'Jewellary', city: 'Colombo', spotlight: true },
  { id: 'vw-58', name: 'Lanka Chandani Cake Creations', category: 'Cakes', city: 'Kadawatha', spotlight: true },
];

export function getCategoryMeta(id) {
  return taskCategories.find((c) => c.id === id) || taskCategories[taskCategories.length - 1];
}

export function groupTasksByMonth(tasks) {
  const groups = {};
  const sorted = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  sorted.forEach((task) => {
    const date = new Date(task.dueDate);
    const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  });
  return groups;
}

const PHASE_ORDER = ['from_start', 'six_months', 'three_months', 'one_month', 'one_week', 'wedding_day'];
const TIMELINE_PHASES = ['from_start', 'six_months', 'three_months', 'one_month', 'one_week'];
const PHASE_ALIASES = { wedding_week: 'one_week' };

export const WEDDING_PHASES = [
  { id: 'from_start', label: 'Just started', shortLabel: 'Start' },
  { id: 'six_months', label: '6 months to go', shortLabel: '6 mo' },
  { id: 'three_months', label: '3 months to go', shortLabel: '3 mo' },
  { id: 'one_month', label: '1 month to go', shortLabel: '1 mo' },
  { id: 'one_week', label: '1 week to go', shortLabel: '1 wk' },
  { id: 'wedding_day', label: 'Wedding day', shortLabel: 'Day' },
];

const PHASE_LABELS = Object.fromEntries(WEDDING_PHASES.map((p) => [p.id, p.label]));

function startOfDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysBeforeWedding(dueDate, weddingDate) {
  const wedding = startOfDay(weddingDate);
  const due = startOfDay(dueDate);
  if (!wedding || !due) return null;
  return Math.round((wedding - due) / 86400000);
}

export function resolveTaskPhase(dueDate, weddingDate, taskPhase) {
  if (taskPhase) {
    const normalized = PHASE_ALIASES[taskPhase] || taskPhase;
    if (PHASE_ORDER.includes(normalized)) return normalized;
  }
  if (!dueDate) return 'from_start';
  if (!weddingDate) return 'from_start';
  const days = daysBeforeWedding(dueDate, weddingDate);
  if (days == null) return 'from_start';
  if (days <= 0) return 'wedding_day';
  if (days <= 7) return 'one_week';
  if (days <= 31) return 'one_month';
  if (days <= 92) return 'three_months';
  if (days <= 186) return 'six_months';
  return 'from_start';
}

export function getPhaseLabel(phaseId) {
  return PHASE_LABELS[phaseId] || 'Your tasks';
}

export function getPhaseDateHint(phaseId, weddingDate) {
  if (!weddingDate) return '';
  const wedding = startOfDay(weddingDate);
  if (!wedding) return '';

  const fmtMonth = (d) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const fmtDay = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (phaseId === 'from_start') {
    const sixBefore = new Date(wedding);
    sixBefore.setMonth(sixBefore.getMonth() - 6);
    return `Before ${fmtMonth(sixBefore)}`;
  }
  if (phaseId === 'six_months') {
    const d = new Date(wedding);
    d.setMonth(d.getMonth() - 6);
    return `Around ${fmtMonth(d)}`;
  }
  if (phaseId === 'three_months') {
    const d = new Date(wedding);
    d.setMonth(d.getMonth() - 3);
    return `Around ${fmtMonth(d)}`;
  }
  if (phaseId === 'one_month') {
    const d = new Date(wedding);
    d.setMonth(d.getMonth() - 1);
    return `Around ${fmtMonth(d)}`;
  }
  if (phaseId === 'one_week') {
    const end = new Date(wedding);
    end.setDate(end.getDate() - 1);
    const start = new Date(wedding);
    start.setDate(start.getDate() - 7);
    return `${fmtDay(start)} – ${fmtDay(end)}`;
  }
  if (phaseId === 'wedding_day') {
    return fmtDay(wedding);
  }
  return '';
}

export function getTaskPhaseGroups(tasks, weddingDate) {
  const counts = {};
  tasks.forEach((task) => {
    const phase = resolveTaskPhase(task.dueDate, weddingDate, task.phase);
    counts[phase] = (counts[phase] || 0) + 1;
  });
  return TIMELINE_PHASES.map((id) => {
    const phase = WEDDING_PHASES.find((row) => row.id === id);
    return {
      id,
      label: phase?.label || id,
      hint: getPhaseDateHint(id, weddingDate),
      count: counts[id] || 0,
    };
  });
}

export function groupTasksByWeddingPhase(tasks, weddingDate) {
  const buckets = Object.fromEntries(PHASE_ORDER.map((id) => [id, []]));

  [...tasks]
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .forEach((task) => {
      const phase = resolveTaskPhase(task.dueDate, weddingDate, task.phase);
      buckets[phase].push(task);
    });

  const groups = {};
  TIMELINE_PHASES.forEach((phaseId) => {
    const phase = WEDDING_PHASES.find((row) => row.id === phaseId);
    if (buckets[phaseId]?.length) {
      groups[phase.label] = {
        tasks: buckets[phaseId],
        phaseId: phase.id,
        hint: getPhaseDateHint(phase.id, weddingDate),
      };
    }
  });
  if (buckets.wedding_day?.length) {
    const phase = WEDDING_PHASES.find((row) => row.id === 'wedding_day');
    groups[phase.label] = {
      tasks: buckets.wedding_day,
      phaseId: 'wedding_day',
      hint: getPhaseDateHint('wedding_day', weddingDate),
    };
  }
  return groups;
}

export function groupTasksByPhase(tasks, weddingDate) {
  const groups = groupTasksByWeddingPhase(tasks, weddingDate);
  return Object.fromEntries(
    Object.entries(groups).map(([label, value]) => [label, value.tasks || value]),
  );
}

export function getTaskDateGroups(tasks) {
  const counts = {};
  tasks.forEach((task) => {
    if (!task?.dueDate) return;
    const date = new Date(task.dueDate);
    if (Number.isNaN(date.getTime())) return;
    const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => new Date(`${a} 1`) - new Date(`${b} 1`))
    .map(([label, count]) => ({ label, count }));
}

export function taskMonthLabel(task) {
  if (!task?.dueDate) return 'No date';
  const date = new Date(task.dueDate);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
