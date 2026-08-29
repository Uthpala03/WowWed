import { normalizeGuestGroup } from '../data/dashboardData';

function isComingRsvp(rsvp) {
  const v = (rsvp || '').trim().toLowerCase();
  return ['accepted', 'coming', 'yes', 'y'].includes(v);
}

function isSeatKey(key, tableId) {
  const prefix = `${tableId}-`;
  if (!key.startsWith(prefix)) return false;
  return /^\d+$/.test(key.slice(prefix.length));
}

/** Table area / suite labels */
export const tableSuites = [
  { id: 'vip', label: 'VIP / Head', icon: '👑' },
  { id: 'bride-family', label: "Bride's Family", icon: '💐' },
  { id: 'groom-family', label: "Groom's Family", icon: "🤵" },
  { id: 'friends', label: 'Friends', icon: '🎉' },
  { id: 'general', label: 'General', icon: '🪑' },
];

export function getSuiteMeta(id) {
  return tableSuites.find((s) => s.id === id) || tableSuites[tableSuites.length - 1];
}

/** Single chair at a table */
export class Seat {
  constructor(index) {
    this.index = index;
  }

  key(tableId) {
    return `${tableId}-${this.index}`;
  }
}

/** Wedding table with shape, suite, priority, and preferred guest groups */
export class Table {
  constructor({
    id,
    name,
    seats,
    shape = 'round',
    priority = 5,
    suite = 'general',
    guestGroups = [],
  }) {
    this.id = id;
    this.name = name;
    this.seats = Math.max(1, Math.min(20, seats));
    this.shape = shape;
    this.priority = Math.max(1, Math.min(10, priority));
    this.suite = suite;
    this.guestGroups = (guestGroups || []).map(normalizeGuestGroup).filter((group) => group && group !== 'No Group');
  }

  static fromJSON(data) {
    return new Table({
      id: data.id,
      name: data.name,
      seats: data.seats,
      shape: data.shape,
      priority: data.priority ?? 5,
      suite: data.suite ?? 'general',
      guestGroups: data.guestGroups || [],
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      seats: this.seats,
      shape: this.shape,
      priority: this.priority,
      suite: this.suite,
      guestGroups: this.guestGroups,
    };
  }

  getLayout() {
    switch (this.shape) {
      case 'rectangle':
        return this.#rectangleLayout(120, 72);
      case 'square':
        return this.#rectangleLayout(88, 88);
      case 'head':
        return this.#headTableLayout();
      case 'standing':
        return this.#circleLayout(36, 52);
      default:
        return this.#circleLayout(48, 62);
    }
  }

  #circleLayout(tableRadius, orbit) {
    const seatSize = 24;
    const center = orbit + seatSize / 2;
    const positions = [];

    for (let i = 0; i < this.seats; i += 1) {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / this.seats;
      positions.push({
        left: center + orbit * Math.cos(angle) - seatSize / 2,
        top: center + orbit * Math.sin(angle) - seatSize / 2,
      });
    }

    const size = (orbit + seatSize / 2) * 2;
    return { positions, width: size, height: size, tableRadius, shape: 'round' };
  }

  #rectangleLayout(width, height) {
    const seatSize = 24;
    const pad = 14;
    const positions = [];
    const n = this.seats;
    const topCount = Math.ceil(n / 4);
    const rightCount = Math.ceil((n - topCount) / 3);
    const bottomCount = Math.ceil((n - topCount - rightCount) / 2);
    const leftCount = n - topCount - rightCount - bottomCount;
    let idx = 0;

    for (let i = 0; i < topCount && idx < n; i += 1, idx += 1) {
      positions.push({
        left: pad + ((width - pad * 2) / Math.max(topCount, 1)) * i + ((width - pad * 2) / Math.max(topCount, 1)) / 2 - seatSize / 2,
        top: -seatSize / 2,
      });
    }
    for (let i = 0; i < rightCount && idx < n; i += 1, idx += 1) {
      positions.push({
        left: width - seatSize / 2,
        top: pad + ((height - pad * 2) / Math.max(rightCount, 1)) * i + ((height - pad * 2) / Math.max(rightCount, 1)) / 2 - seatSize / 2,
      });
    }
    for (let i = 0; i < bottomCount && idx < n; i += 1, idx += 1) {
      positions.push({
        left: pad + ((width - pad * 2) / Math.max(bottomCount, 1)) * i + ((width - pad * 2) / Math.max(bottomCount, 1)) / 2 - seatSize / 2,
        top: height - seatSize / 2,
      });
    }
    for (let i = 0; i < leftCount && idx < n; i += 1, idx += 1) {
      positions.push({
        left: -seatSize / 2,
        top: pad + ((height - pad * 2) / Math.max(leftCount, 1)) * i + ((height - pad * 2) / Math.max(leftCount, 1)) / 2 - seatSize / 2,
      });
    }

    return {
      positions,
      width: width + seatSize,
      height: height + seatSize,
      tableWidth: width,
      tableHeight: height,
      shape: 'rectangle',
    };
  }

  #headTableLayout() {
    const width = 160;
    const height = 44;
    const seatSize = 24;
    const positions = [];

    for (let i = 0; i < this.seats; i += 1) {
      positions.push({
        left: 12 + ((width - 24) / Math.max(this.seats, 1)) * i + ((width - 24) / Math.max(this.seats, 1)) / 2 - seatSize / 2,
        top: height - seatSize / 2 + 4,
      });
    }

    return {
      positions,
      width: width + seatSize,
      height: height + seatSize + 8,
      tableWidth: width,
      tableHeight: height,
      shape: 'head',
    };
  }
}

/** Manages tables, suites, assignments, and bulk seating */
export class SeatingChart {
  constructor(data = {}, guests = []) {
    this.tables = (data.tables || []).map((t) => Table.fromJSON(t));
    this.assignments = { ...(data.assignments || {}) };
    this.guests = guests;
  }

  toJSON() {
    return {
      tables: this.tables.map((t) => t.toJSON()),
      assignments: this.assignments,
    };
  }

  getGuest(id) {
    return this.guests.find((g) => g.id === id);
  }

  getGuestName(id) {
    return this.getGuest(id)?.name || '';
  }

  get tablesByPriority() {
    return [...this.tables].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  }

  get tablesBySuite() {
    const map = {};
    tableSuites.forEach((s) => { map[s.id] = []; });
    this.tables.forEach((t) => {
      if (!map[t.suite]) map[t.suite] = [];
      map[t.suite].push(t);
    });
    return tableSuites
      .filter((s) => map[s.id]?.length)
      .map((s) => ({ suite: s, tables: map[s.id].sort((a, b) => a.priority - b.priority) }));
  }

  assignGuest(tableId, seatIndex, guestId) {
    this.unassignGuest(guestId);
    this.assignments[`${tableId}-${seatIndex}`] = guestId;
  }

  unassignGuest(guestId) {
    Object.keys(this.assignments).forEach((key) => {
      if (this.assignments[key] === guestId) delete this.assignments[key];
    });
  }

  unassignSeat(tableId, seatIndex) {
    delete this.assignments[`${tableId}-${seatIndex}`];
  }

  addTable(table) {
    this.tables.push(table);
  }

  updateTable(tableId, updates) {
    const idx = this.tables.findIndex((t) => t.id === tableId);
    if (idx < 0) return;
    const current = this.tables[idx].toJSON();
    this.tables[idx] = Table.fromJSON({ ...current, ...updates, id: tableId });

    const newSeats = this.tables[idx].seats;
    Object.keys(this.assignments).forEach((key) => {
      if (!isSeatKey(key, tableId)) return;
      const seatIdx = Number(key.slice(`${tableId}-`.length));
      if (seatIdx >= newSeats) delete this.assignments[key];
    });
  }

  removeTable(tableId) {
    this.tables = this.tables.filter((t) => t.id !== tableId);
    Object.keys(this.assignments).forEach((key) => {
      if (isSeatKey(key, tableId)) delete this.assignments[key];
    });
  }

  /** Drop tables with no seated guests (e.g. after auto-seat). Returns how many were removed. */
  pruneEmptyTables() {
    const empty = this.tables.filter((t) => this.getTableFill(t.id).filled === 0);
    empty.forEach((t) => this.removeTable(t.id));
    return empty.length;
  }

  get assignedGuestIds() {
    return Object.values(this.assignments);
  }

  get unassignedGuests() {
    return this.guests.filter((g) => !this.assignedGuestIds.includes(g.id));
  }

  get waitingToSeat() {
    return this.unassignedGuests.filter((g) => isComingRsvp(g.rsvp));
  }

  get assignedGuests() {
    return this.guests.filter((g) => this.assignedGuestIds.includes(g.id));
  }

  getTableForGuest(guestId) {
    const entry = Object.entries(this.assignments).find(([, id]) => id === guestId);
    if (!entry) return null;
    return this.tables.find((t) => isSeatKey(entry[0], t.id)) || null;
  }

  getTableFill(tableId) {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return { filled: 0, total: 0 };
    let filled = 0;
    for (let i = 0; i < table.seats; i += 1) {
      if (this.assignments[`${tableId}-${i}`]) filled += 1;
    }
    return { filled, total: table.seats };
  }

  /** Pick guests for a table — prefers matching group, then table guestGroups, then any */
  #candidatesForTable(table, pool, guestGroup) {
    let list = [...pool];
    if (guestGroup && guestGroup !== 'Any') {
      const matched = list.filter((g) => normalizeGuestGroup(g.group) === normalizeGuestGroup(guestGroup));
      const rest = list.filter((g) => normalizeGuestGroup(g.group) !== normalizeGuestGroup(guestGroup));
      list = [...matched, ...rest];
    } else if (table.guestGroups?.length) {
      const tags = new Set(table.guestGroups.map(normalizeGuestGroup));
      const matched = list.filter((g) => tags.has(normalizeGuestGroup(g.group)));
      const rest = list.filter((g) => !tags.has(normalizeGuestGroup(g.group)));
      list = [...matched, ...rest];
    }
    return list;
  }

  /** Count unassigned guests ready to seat, by group */
  getGroupCounts() {
    const pool = this.unassignedGuests.filter(
      (g) => g.rsvp !== 'Rejected' && g.rsvp !== 'Declined',
    );
    const counts = { Any: pool.length };
    pool.forEach((g) => {
      const grp = normalizeGuestGroup(g.group);
      counts[grp] = (counts[grp] || 0) + 1;
    });
    return counts;
  }

  /** Seated / waiting / total counts per group (Coming guests only) */
  getGroupStats() {
    const stats = {};
    const assigned = new Set(this.assignedGuestIds);
    this.guests.forEach((g) => {
      if (!isComingRsvp(g.rsvp)) return;
      const grp = normalizeGuestGroup(g.group);
      if (!stats[grp]) stats[grp] = { total: 0, seated: 0, waiting: 0 };
      stats[grp].total += 1;
      if (assigned.has(g.id)) stats[grp].seated += 1;
      else stats[grp].waiting += 1;
    });
    return stats;
  }

  /** Bulk-fill empty seats — strict group when specified */
  fillTable(tableId, guestGroup = 'Any') {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return { filled: 0, message: 'Table not found' };

    const fill = this.getTableFill(tableId);
    const emptySeats = fill.total - fill.filled;

    if (emptySeats === 0) {
      return {
        filled: 0,
        emptySeats: 0,
        message: `Table is full (${fill.filled}/${fill.total}). Use "Replace all" to swap guests.`,
      };
    }

    let pool = this.unassignedGuests.filter(
      (g) => g.rsvp !== 'Rejected' && g.rsvp !== 'Declined',
    );

    if (guestGroup && guestGroup !== 'Any') {
      const want = normalizeGuestGroup(guestGroup);
      pool = pool.filter((g) => normalizeGuestGroup(g.group) === want);
    } else {
      pool = this.#candidatesForTable(table, pool, null);
    }

    if (!pool.length) {
      const label = guestGroup === 'Any' ? 'unassigned' : guestGroup;
      return {
        filled: 0,
        emptySeats,
        message: `No ${label} guests waiting to be seated.`,
      };
    }

    let filled = 0;
    const working = [...pool];
    for (let i = 0; i < table.seats; i += 1) {
      if (this.assignments[`${tableId}-${i}`]) continue;
      const guest = working.shift();
      if (!guest) break;
      this.assignGuest(tableId, i, guest.id);
      filled += 1;
    }

    if (guestGroup && guestGroup !== 'Any') {
      table.guestGroups = [guestGroup];
    }

    return {
      filled,
      emptySeats: emptySeats - filled,
      message: filled
        ? `${filled} ${guestGroup === 'Any' ? '' : guestGroup + ' '}guest(s) seated`
        : `Could not seat any ${guestGroup} guests.`,
    };
  }

  /** Clear table and seat only matching group (strict) */
  replaceTableWithGroup(tableId, guestGroup) {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return { filled: 0, message: 'Table not found' };

    for (let i = 0; i < table.seats; i += 1) {
      delete this.assignments[`${tableId}-${i}`];
    }

    if (guestGroup && guestGroup !== 'Any') {
      table.guestGroups = [guestGroup];
    }

    let pool = this.unassignedGuests.filter(
      (g) => g.rsvp !== 'Rejected' && g.rsvp !== 'Declined',
    );

    if (guestGroup && guestGroup !== 'Any') {
      const want = normalizeGuestGroup(guestGroup);
      pool = pool.filter((g) => normalizeGuestGroup(g.group) === want);
    }

    if (!pool.length) {
      return {
        filled: 0,
        message: guestGroup === 'Any'
          ? 'No unassigned guests available.'
          : `No ${guestGroup} guests available to seat here.`,
      };
    }

    let filled = 0;
    const working = [...pool];
    for (let i = 0; i < table.seats && working.length; i += 1) {
      const guest = working.shift();
      this.assignGuest(tableId, i, guest.id);
      filled += 1;
    }

    const left = table.seats - filled;
    return {
      filled,
      message: left > 0
        ? `${filled} seated · ${left} empty seat(s) — not enough ${guestGroup} guests`
        : `${filled} ${guestGroup === 'Any' ? '' : guestGroup + ' '}guest(s) now at this table`,
    };
  }

  clearTable(tableId) {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return;
    for (let i = 0; i < table.seats; i += 1) {
      delete this.assignments[`${tableId}-${i}`];
    }
  }

  /** Bulk-fill all tables in a suite (by table priority) */
  fillSuite(suiteId, guestGroup = 'Any') {
    const tables = this.tables.filter((t) => t.suite === suiteId).sort((a, b) => a.priority - b.priority);
    let total = 0;
    const messages = [];
    tables.forEach((t) => {
      const result = this.fillTable(t.id, guestGroup);
      total += result.filled;
      if (result.message && result.filled === 0 && tables.length === 1) messages.push(result.message);
    });
    return { filled: total, message: messages[0] || `${total} guest(s) seated in suite` };
  }

  /** Auto-seat all guests using table priority + group matching */
  autoSeatAll() {
    this.assignments = {};
    const pool = this.guests.filter((g) => isComingRsvp(g.rsvp));
    const conflicts = [];
    let remaining = [...pool];

    this.tablesByPriority.forEach((table) => {
      const ordered = this.#candidatesForTable(table, remaining, null);
      for (let i = 0; i < table.seats && ordered.length; i += 1) {
        const guest = ordered.shift();
        this.assignments[`${table.id}-${i}`] = guest.id;
        remaining = remaining.filter((g) => g.id !== guest.id);
      }
    });

    if (remaining.length) {
      conflicts.push(`${remaining.length} guest(s) could not be seated — add more tables or seats.`);
    }
    return { filled: pool.length - remaining.length, conflicts };
  }

  get stats() {
    const totalSeats = this.tables.reduce((sum, t) => sum + t.seats, 0);
    const coming = this.guests.filter((g) => isComingRsvp(g.rsvp));
    const seatedComing = coming.filter((g) => this.assignedGuestIds.includes(g.id)).length;
    return {
      tables: this.tables.length,
      guests: this.guests.length,
      coming: coming.length,
      assigned: seatedComing,
      unassigned: coming.length - seatedComing,
      totalSeats,
      emptySeats: totalSeats - this.assignedGuestIds.length,
    };
  }
}
