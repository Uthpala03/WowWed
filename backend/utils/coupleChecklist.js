const { query } = require('../config/db');
const { templatesForCeremony } = require('../data/checklistTemplates');

const PHASE_LABELS = {
  from_start: 'Just started',
  six_months: '6 months to go',
  three_months: '3 months to go',
  one_month: '1 month to go',
  wedding_week: '1 week to go',
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDay(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addMonths(date, months) {
  const next = new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
  if (next.getDate() !== date.getDate()) next.setDate(0);
  return next;
}

function dueForPhase(phase, weddingDate, startedAt) {
  const wedding = parseDay(weddingDate);
  const start = parseDay(startedAt) || new Date();
  if (!wedding) return formatDate(start);

  let due;
  if (phase === 'from_start') {
    due = addMonths(wedding, -8);
  } else if (phase === 'six_months') {
    due = addMonths(wedding, -6);
  } else if (phase === 'three_months') {
    due = addMonths(wedding, -3);
  } else if (phase === 'one_month') {
    due = addMonths(wedding, -1);
  } else {
    due = new Date(wedding);
    due.setDate(due.getDate() - 4);
  }

  if (due < start) {
    due = new Date(start);
    due.setDate(due.getDate() + 7);
  }
  return formatDate(due);
}

const CEREMONY_KEYS = {
  'Poruwa Ceremony': 'poruwa',
  Poruwa: 'poruwa',
  poruwa: 'poruwa',
  'Church Wedding': 'church',
  Church: 'church',
  church: 'church',
  Christian: 'church',
  'Hindu Tamil Wedding': 'hindu',
  hindu: 'hindu',
  Hindu: 'hindu',
  Tamil: 'hindu',
  'Tamil/Hindu': 'hindu',
  'Muslim Nikah Ceremony': 'nikah',
  Muslim: 'nikah',
  nikah: 'nikah',
  Reception: 'reception',
  reception: 'reception',
  Civil: 'reception',
};

function ceremonyKeyFromValue(value) {
  if (!value) return 'poruwa';
  const raw = String(value).trim();
  if (CEREMONY_KEYS[raw]) return CEREMONY_KEYS[raw];
  const lower = raw.toLowerCase();
  if (CEREMONY_KEYS[lower]) return CEREMONY_KEYS[lower];
  if (lower.includes('church') || lower.includes('christian')) return 'church';
  if (lower.includes('nikah') || lower.includes('muslim')) return 'nikah';
  if (lower.includes('hindu') || lower.includes('tamil')) return 'hindu';
  if (lower.includes('reception') || lower.includes('civil')) return 'reception';
  if (lower.includes('poruwa')) return 'poruwa';
  return 'poruwa';
}

async function loadChecklistTemplates(ceremonyKey) {
  return templatesForCeremony(ceremonyKey);
}

function tasksFromTemplates(templates, weddingDate, startedAt, ceremonyKey, existing = []) {
  const doneByTitle = new Map();
  existing.forEach((task) => {
    if (task.done) doneByTitle.set(normalizeTitle(task.title), true);
  });

  return templates.map((row) => ({
    id: `seed-${row.id}`,
    title: row.title,
    category: row.category,
    phase: row.phase,
    phaseLabel: PHASE_LABELS[row.phase] || row.phase,
    ceremonyKey,
    dueDate: dueForPhase(row.phase, weddingDate, startedAt),
    done: doneByTitle.get(normalizeTitle(row.title)) || false,
    assigned: 'Unassigned',
    notes: '',
    suggested: true,
  }));
}

async function loadCoupleTiming(userId) {
  const rows = await query(
    `SELECT u.created_at, wp.wedding_date, wp.ceremony_type
     FROM users u
     LEFT JOIN wedding_profiles wp ON wp.user_id = u.id
     WHERE u.id = :userId`,
    { userId },
  );
  const row = rows[0] || {};
  return {
    startedAt: row.created_at,
    weddingDate: row.wedding_date ? String(row.wedding_date).slice(0, 10) : '',
    ceremonyKey: ceremonyKeyFromValue(row.ceremony_type),
  };
}

async function saveCoupleTasks(userId, tasks) {
  await query(
    `INSERT INTO user_data (user_id, store_key, data_json)
     VALUES (:userId, 'tasks', :data)
     ON DUPLICATE KEY UPDATE data_json = :data, updated_at = NOW()`,
    { userId, data: JSON.stringify(tasks) },
  );
  return tasks;
}

function normalizeTitle(title) {
  return String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function isGeneratedTask(task) {
  const id = String(task.id || '');
  return Boolean(task.suggested)
    || id.startsWith('seed-')
    || id.startsWith('sl-')
    || /^t([1-9]|[12]\d|30)$/.test(id);
}

function isStarterTask(task) {
  return isGeneratedTask(task)
    && !task.done
    && (!task.assigned || task.assigned === 'Unassigned')
    && !String(task.notes || '').trim();
}

function isPristineGeneratedTask(task) {
  return isGeneratedTask(task)
    && (!task.assigned || task.assigned === 'Unassigned')
    && !String(task.notes || '').trim();
}

function shouldRebuildChecklist(current, templates) {
  if (current.length === 0) return true;
  if (current.every(isStarterTask)) return true;

  const seedTasks = current.filter((task) => String(task.id || '').startsWith('seed-'));
  if (seedTasks.length === 0) return false;
  if (seedTasks.length !== templates.length && current.every(isPristineGeneratedTask)) return true;

  const phases = new Set(seedTasks.map((task) => task.phase).filter(Boolean));
  return seedTasks.length !== templates.length
    && phases.size < 5
    && current.every(isPristineGeneratedTask);
}

async function applyChecklistForCouple(userId, existingTasks = []) {
  const current = Array.isArray(existingTasks) ? existingTasks : [];
  const { startedAt, weddingDate, ceremonyKey } = await loadCoupleTiming(userId);
  if (!weddingDate) return current;

  const templates = await loadChecklistTemplates(ceremonyKey);
  if (!templates.length) return current;

  if (shouldRebuildChecklist(current, templates)) {
    return saveCoupleTasks(
      userId,
      tasksFromTemplates(templates, weddingDate, startedAt, ceremonyKey, current),
    );
  }

  const wantedIds = new Set(templates.map((row) => `seed-${row.id}`));
  const keptTitles = new Set();
  let changed = false;
  const next = [];

  current.forEach((task) => {
    const isSeed = String(task.id || '').startsWith('seed-');
    if (isStarterTask(task) && isSeed && !wantedIds.has(task.id)) {
      changed = true;
      return;
    }
    if (isStarterTask(task) && !isSeed) {
      changed = true;
      return;
    }

    let updated = task;
    if (isSeed && task.ceremonyKey !== ceremonyKey) {
      changed = true;
      updated = { ...updated, ceremonyKey };
    }
    if (task.suggested && !task.done && task.phase) {
      const dueDate = dueForPhase(task.phase, weddingDate, startedAt);
      if (dueDate && dueDate !== task.dueDate) {
        changed = true;
        updated = { ...updated, dueDate, phaseLabel: PHASE_LABELS[task.phase] || task.phase };
      }
    }
    keptTitles.add(normalizeTitle(updated.title));
    next.push(updated);
  });

  const have = new Set(next.map((task) => task.id));
  templates.forEach((row) => {
    const id = `seed-${row.id}`;
    if (have.has(id) || keptTitles.has(normalizeTitle(row.title))) return;
    changed = true;
    next.push(tasksFromTemplates([row], weddingDate, startedAt, ceremonyKey)[0]);
  });

  if (changed) return saveCoupleTasks(userId, next);
  return current;
}

module.exports = {
  PHASE_LABELS,
  applyChecklistForCouple,
  loadChecklistTemplates,
};
