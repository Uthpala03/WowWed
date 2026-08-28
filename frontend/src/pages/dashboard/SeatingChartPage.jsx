import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TableVisual from '../../components/seating/TableVisual';
import { guestGroups, tableShapes } from '../../data/dashboardData';
import { SeatingChart, Table, getSuiteMeta, tableSuites } from '../../models/Seating';
import { getGuests, getSeating, saveSeating } from '../../utils/storage';
import { api } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import PrettySelect from '../../components/ui/PrettySelect';

const emptyTableForm = {
  name: '',
  seats: 6,
  shape: 'round',
  suite: 'general',
  priority: 5,
  guestGroup: '',
};

const SUITE_TABLE_CONFIG = {
  vip: { shape: 'head', seats: 10, priority: 1 },
  'bride-family': { shape: 'round', seats: 10, priority: 2 },
  'groom-family': { shape: 'round', seats: 10, priority: 2 },
  friends: { shape: 'round', seats: 10, priority: 3 },
  general: { shape: 'round', seats: 10, priority: 4 },
};

const SUITE_ORDER = ['vip', 'bride-family', 'groom-family', 'friends', 'general'];

/** Which floor-plan zone(s) each guest list group uses */
const GUEST_GROUP_SUITES = {
  VIP: ['vip'],
  "Bride's Family": ['bride-family'],
  "Groom's Family": ['groom-family'],
  "Bride's Friends": ['friends'],
  "Groom's Friends": ['friends'],
  "Bride's Colleagues": ['friends'],
  "Groom's Colleagues": ['friends'],
  Relatives: ['bride-family', 'groom-family'],
  Neighbours: ['general'],
  Other: ['general'],
};

function tableHasGuestFromGroup(chart, table, group) {
  for (let seatIndex = 0; seatIndex < table.seats; seatIndex += 1) {
    const guestId = chart.assignments[`${table.id}-${seatIndex}`];
    if (!guestId) continue;
    const guest = chart.getGuest(guestId);
    if (guest?.group === group) return true;
  }
  return false;
}

function tableMatchesGroupFilter(chart, table, groupFilter) {
  if (groupFilter === 'All') return true;

  const suites = GUEST_GROUP_SUITES[groupFilter];
  if (!suites?.includes(table.suite)) return false;

  if (groupFilter === 'Relatives') {
    return tableHasGuestFromGroup(chart, table, 'Relatives')
      || chart.getTableFill(table.id).filled === 0;
  }

  if (['vip', 'bride-family', 'groom-family'].includes(table.suite)) return true;

  if (table.guestGroups?.includes(groupFilter)) return true;
  if (tableHasGuestFromGroup(chart, table, groupFilter)) return true;
  return chart.getTableFill(table.id).filled === 0;
}

function formatGroupOptionLabel(group, waiting, seated) {
  const parts = [];
  if (seated > 0) parts.push(`${seated} seated`);
  if (waiting > 0) parts.push(`${waiting} waiting`);
  if (!parts.length) parts.push('none yet');
  return `${group} (${parts.join(', ')})`;
}

function isComingGuest(guest) {
  const v = (guest.rsvp || '').trim().toLowerCase();
  return ['accepted', 'coming', 'yes', 'y'].includes(v);
}

function countGuestsBySuite(guestList) {
  const counts = { vip: 0, 'bride-family': 0, 'groom-family': 0, friends: 0, general: 0 };
  let relatives = 0;
  guestList.filter(isComingGuest).forEach((guest) => {
    const group = (guest.group || '').trim().toLowerCase();
    if (group === 'vip') counts.vip += 1;
    else if (group.includes('bride') && group.includes('family')) counts['bride-family'] += 1;
    else if (group.includes('groom') && group.includes('family')) counts['groom-family'] += 1;
    else if (group === 'relatives') relatives += 1;
    else if (group.includes('friend') || group.includes('colleague')) counts.friends += 1;
    else counts.general += 1;
  });
  counts['bride-family'] += Math.ceil(relatives / 2);
  counts['groom-family'] += Math.floor(relatives / 2);
  return counts;
}

function allocateTablesBySuite(counts, comingTotal) {
  const seatsPerTable = 10;
  const totalTables = Math.max(1, Math.ceil(comingTotal / seatsPerTable));
  const activeSuites = SUITE_ORDER.filter((suite) => (counts[suite] || 0) > 0);
  if (!activeSuites.length) return { general: totalTables };

  const guestSum = activeSuites.reduce((sum, suite) => sum + counts[suite], 0);
  const allocation = {};
  let remaining = totalTables;

  activeSuites.forEach((suite, index) => {
    if (index === activeSuites.length - 1) {
      allocation[suite] = Math.max(remaining, 1);
      return;
    }
    const share = Math.max(1, Math.round((counts[suite] / guestSum) * totalTables));
    const capped = Math.min(share, Math.ceil(counts[suite] / seatsPerTable), remaining - (activeSuites.length - index - 1));
    allocation[suite] = Math.max(1, capped);
    remaining -= allocation[suite];
  });

  const used = Object.values(allocation).reduce((sum, n) => sum + n, 0);
  if (used > totalTables) {
    const largest = activeSuites.reduce((best, suite) => (
      (allocation[suite] || 0) > (allocation[best] || 0) ? suite : best
    ), activeSuites[0]);
    allocation[largest] -= used - totalTables;
  } else if (used < totalTables) {
    allocation[activeSuites[activeSuites.length - 1]] += totalTables - used;
  }
  return allocation;
}

function buildTablesForSuites(counts, comingTotal, startNum = 1) {
  const allocation = allocateTablesBySuite(counts, comingTotal);
  const tables = [];
  let tableNo = startNum;

  SUITE_ORDER.forEach((suite) => {
    const tableCount = allocation[suite] || 0;
    if (tableCount <= 0) return;
    const cfg = SUITE_TABLE_CONFIG[suite];
    for (let i = 0; i < tableCount; i += 1) {
      tables.push({
        id: `table-auto-${suite}-${tableNo}`,
        name: suite === 'vip' && i === 0 ? 'Head Table' : `Table ${tableNo}`,
        seats: cfg.seats,
        shape: cfg.shape,
        suite,
        priority: cfg.priority,
        guestGroups: [],
      });
      tableNo += 1;
    }
  });
  return tables;
}

function tablesOnlyGeneral(existingTables) {
  return !existingTables.length || existingTables.every((table) => (table.suite || 'general') === 'general');
}

function SeatingChartPage() {
  const coupleData = useOutletContext();
  const guests = coupleData?.guests || getGuests() || [];
  const [chart, setChart] = useState(() => new SeatingChart(coupleData?.seating || getSeating(), guests));

  useEffect(() => {
    setChart(new SeatingChart(coupleData?.seating || getSeating(), coupleData?.guests || getGuests() || []));
  }, [coupleData]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTableId, setEditingTableId] = useState(null);
  const [tableForm, setTableForm] = useState(emptyTableForm);
  const [toast, setToast] = useState('');
  const [reviewFlags, setReviewFlags] = useState([]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const persist = (nextChart, quality) => {
    setChart(nextChart);
    const prev = coupleData?.seating || getSeating() || {};
    saveSeating({
      ...nextChart.toJSON(),
      mlQuality: quality || prev.mlQuality || null,
    });
  };

  const stats = useMemo(() => chart.stats, [chart]);
  const suiteGroups = useMemo(() => chart.tablesBySuite, [chart]);
  const waitingGroupCounts = useMemo(() => chart.getGroupCounts(), [chart]);
  const seatedGroupCounts = useMemo(() => {
    const counts = {};
    chart.assignedGuests.forEach((guest) => {
      const label = guest.group || 'No Group';
      counts[label] = (counts[label] || 0) + 1;
    });
    return counts;
  }, [chart]);
  const seatGroups = guestGroups.filter((g) => g !== 'No Group');

  const filteredSuiteGroups = useMemo(() => {
    if (groupFilter === 'All') return suiteGroups;
    return suiteGroups
      .map(({ suite, tables }) => ({
        suite,
        tables: tables.filter((table) => tableMatchesGroupFilter(chart, table, groupFilter)),
      }))
      .filter(({ tables }) => tables.length > 0);
  }, [chart, suiteGroups, groupFilter]);

  const handleGroupFilterChange = (value) => {
    setGroupFilter(value);
    setSelectedTableId(null);
  };

  const filteredUnassigned = chart.waitingToSeat.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.name.toLowerCase().includes(q);
    const matchGroup = groupFilter === 'All' || g.group === groupFilter;
    return matchSearch && matchGroup;
  });

  const selectedTableDetail = useMemo(() => {
    if (!selectedTableId) return null;
    const table = chart.tables.find((t) => t.id === selectedTableId);
    if (!table) return null;

    const rows = [];
    for (let seatIndex = 0; seatIndex < table.seats; seatIndex += 1) {
      const guestId = chart.assignments[`${table.id}-${seatIndex}`];
      if (!guestId) continue;
      const guest = chart.getGuest(guestId);
      if (guest) rows.push({ seat: seatIndex + 1, guest });
    }

    const groupCounts = {};
    rows.forEach(({ guest }) => {
      const label = guest.group || 'No Group';
      groupCounts[label] = (groupCounts[label] || 0) + 1;
    });

    return {
      table,
      rows,
      groupCounts,
      suite: getSuiteMeta(table.suite),
    };
  }, [chart, selectedTableId]);

  const sidebarSeatedGuests = useMemo(() => {
    let list = chart.assignedGuests;
    if (selectedTableDetail) {
      const ids = new Set(selectedTableDetail.rows.map(({ guest }) => guest.id));
      list = list.filter((g) => ids.has(g.id));
    }
    const q = search.toLowerCase();
    return list.filter((g) => {
      const matchSearch = !q || g.name.toLowerCase().includes(q);
      const matchGroup = groupFilter === 'All' || g.group === groupFilter;
      return matchSearch && matchGroup;
    });
  }, [chart, selectedTableDetail, search, groupFilter]);

  const previewTable = useMemo(
    () => new Table({
      id: 'preview',
      name: 'Preview',
      seats: tableForm.seats,
      shape: tableForm.shape,
      suite: tableForm.suite,
      priority: tableForm.priority,
      guestGroups: tableForm.guestGroup ? [tableForm.guestGroup] : [],
    }),
    [tableForm],
  );

  const openAddTable = () => {
    setEditingTableId(null);
    setTableForm({ ...emptyTableForm, name: String(chart.tables.length + 1) });
    setShowTableModal(true);
  };

  const openEditTable = (table) => {
    setEditingTableId(table.id);
    setTableForm({
      name: table.name.replace(/^Table\s/, ''),
      seats: table.seats,
      shape: table.shape,
      suite: table.suite,
      priority: table.priority,
      guestGroup: table.guestGroups?.[0] || '',
    });
    setShowTableModal(true);
  };

  const closeTableModal = () => {
    setShowTableModal(false);
    setEditingTableId(null);
    setTableForm(emptyTableForm);
  };

  const submitTable = (e) => {
    e.preventDefault();
    const next = new SeatingChart(chart.toJSON(), guests);
    const tableName = tableForm.name.startsWith('Table') ? tableForm.name : `Table ${tableForm.name}`;
    const data = {
      name: tableName,
      seats: tableForm.seats,
      shape: tableForm.shape,
      suite: tableForm.suite,
      priority: tableForm.priority,
      guestGroups: tableForm.guestGroup ? [tableForm.guestGroup] : [],
    };

    if (editingTableId) {
      next.updateTable(editingTableId, data);
    } else {
      next.addTable(new Table({ id: `table-${Date.now()}`, ...data }));
    }
    persist(next);
    closeTableModal();
  };

  const handleSeatClick = (tableId, seatIndex, currentGuestId) => {
    const next = new SeatingChart(chart.toJSON(), guests);
    if (currentGuestId) {
      next.unassignSeat(tableId, seatIndex);
      persist(next);
      return;
    }
    if (selectedGuest) {
      next.assignGuest(tableId, seatIndex, selectedGuest);
      persist(next);
      setSelectedGuest(null);
    }
  };

  const seatTableWithGroup = (tableId, group) => {
    if (!group) return;
    const next = new SeatingChart(chart.toJSON(), guests);
    const result = next.replaceTableWithGroup(tableId, group);
    persist(next);
    showToast(result.message);
  };

  const clearTable = (tableId) => {
    const next = new SeatingChart(chart.toJSON(), guests);
    next.clearTable(tableId);
    const table = next.tables.find((t) => t.id === tableId);
    if (table) table.guestGroups = [];
    persist(next);
  };

  const updateAllTables = (updates) => {
    const next = new SeatingChart(chart.toJSON(), guests);
    next.tables.forEach((table) => next.updateTable(table.id, updates));
    persist(next);
  };

  const sharedShape = chart.tables.length && chart.tables.every((t) => t.shape === chart.tables[0].shape)
    ? chart.tables[0].shape
    : '';
  const sharedSeats = chart.tables.length && chart.tables.every((t) => t.seats === chart.tables[0].seats)
    ? chart.tables[0].seats
    : null;

  const comingCount = guests.filter(isComingGuest).length;

  const tablesForComing = () => {
    const existing = chart.tables.map((t) => t.toJSON());
    const bySuite = countGuestsBySuite(guests);
    const target = allocateTablesBySuite(bySuite, comingCount);

    if (tablesOnlyGeneral(existing)) {
      return buildTablesForSuites(bySuite, comingCount);
    }

    const existingBySuite = {};
    existing.forEach((table) => {
      const suite = table.suite || 'general';
      if (!existingBySuite[suite]) existingBySuite[suite] = [];
      existingBySuite[suite].push(table);
    });

    const workTables = [];
    let nextNum = existing.length + 1;
    SUITE_ORDER.forEach((suite) => {
      const need = target[suite] || 0;
      const have = existingBySuite[suite] || [];
      have.slice(0, need).forEach((table) => workTables.push(table));
      const cfg = SUITE_TABLE_CONFIG[suite];
      for (let i = have.length; i < need; i += 1) {
        workTables.push({
          id: `table-auto-${suite}-${nextNum}`,
          name: suite === 'vip' && i === 0 && !have.length ? 'Head Table' : `Table ${nextNum}`,
          seats: cfg.seats,
          shape: cfg.shape,
          suite,
          priority: cfg.priority,
          guestGroups: [],
        });
        nextNum += 1;
      }
    });
    return workTables;
  };

  const runAutoSeat = async () => {
    showToast('Smart seating running...');
    const workTables = tablesForComing();
    try {
      const data = await api.optimizeSeating({
        guests: guests.map((g) => ({
          id: g.id,
          name: g.name,
          email: g.email || '',
          phone: g.phone || '',
          group: g.group || '',
          notes: g.notes || '',
          rsvp: g.rsvp || '',
          avoid: g.avoid || '',
          age: g.age || '',
        })),
        tables: workTables.map((t) => ({
          id: t.id,
          name: t.name,
          seats: t.seats,
          shape: t.shape,
          suite: t.suite,
          priority: t.priority,
        })),
      });

      const used = new Set();
      const matchGuest = (row) => {
        if (row.id) {
          const hit = guests.find((g) => String(g.id) === String(row.id) && !used.has(g.id));
          if (hit) return hit.id;
        }
        const email = (row.email || '').trim().toLowerCase();
        const phone = String(row.phone || '').replace(/\D/g, '');
        const name = (row.name || '').trim().toLowerCase();
        const found = guests.find((g) => {
          if (used.has(g.id)) return false;
          const gEmail = (g.email || '').trim().toLowerCase();
          const gPhone = String(g.phone || '').replace(/\D/g, '');
          if (email && gEmail && gEmail === email) return true;
          if (phone && gPhone && gPhone === phone) return true;
          return name && (g.name || '').trim().toLowerCase() === name;
        });
        return found?.id || null;
      };

      const next = new SeatingChart({ tables: workTables, assignments: {} }, guests);

      const filledTableIds = new Set();
      let seated = 0;
      (data.assignments || []).forEach((row) => {
        const id = matchGuest(row);
        if (!id) return;
        used.add(id);
        const table = next.tables.find((t) => t.id === row.table_id)
          || next.tables.find((t) => t.name === row.table);
        if (!table) return;
        const seatIndex = Number(row.seat) - 1;
        if (seatIndex < 0 || seatIndex >= table.seats) return;
        next.assignGuest(table.id, seatIndex, id);
        filledTableIds.add(table.id);
        seated += 1;
      });

      next.tables = next.tables.filter((table) => filledTableIds.has(table.id));

      const quality = {
        silhouette: data.silhouette,
        k: data.k,
        capacityViolations: data.capacity_violations,
        violationRate: data.violation_rate,
        assigned: seated,
        coming: data.coming,
        seatingAccuracy: data.seating_accuracy,
        labelAccuracy: data.label_accuracy,
      };
      persist(next, quality);
      const leftover = Math.max(0, comingCount - seated);
      const flags = (data.flags || []).filter((flag) => flag.type !== 'unseated' || leftover > 0);
      if (leftover > 0 && !flags.some((flag) => flag.type === 'unseated')) {
        flags.unshift({
          type: 'unseated',
          message: `${leftover} Coming guest(s) have no chair. Add tables or chairs, then Auto-seat again.`,
        });
      }
      setReviewFlags(flags);
      showToast(
        leftover > 0
          ? `${seated} of ${comingCount} Coming guests seated. ${leftover} still need a chair.`
          : `${seated} Coming guests seated.`,
      );
    } catch (err) {
      const next = new SeatingChart({ tables: workTables, assignments: {} }, guests);
      const { filled, conflicts } = next.autoSeatAll();
      persist(next);
      showToast(conflicts[0] || `${filled} guests seated.`);
    }
  };

  const removeTable = (tableId) => {
    const next = new SeatingChart(chart.toJSON(), guests);
    next.removeTable(tableId);
    persist(next);
    if (selectedTableId === tableId) setSelectedTableId(null);
  };

  return (
    <div className="dash-page dash-page--seating">
      <PageHeader moduleId="seating">
        <div className="dash-page__actions">
          <button type="button" className="dash-btn dash-btn--outline" onClick={runAutoSeat}>Auto-seat all</button>
          <button type="button" className="dash-btn dash-btn--primary" onClick={openAddTable}>+ Add table</button>
        </div>
      </PageHeader>

      {toast && <div className="guest-import-toast">{toast}</div>}

      {reviewFlags.length > 0 && (
        <section className="seating-review">
          <div className="seating-review__head">
            <strong>Review after Auto-seat</strong>
            <button type="button" className="seating-review__close" onClick={() => setReviewFlags([])}>Dismiss</button>
          </div>
          <p>These are not errors. Move people by tapping a guest, then an empty chair.</p>
          <ul>
            {reviewFlags.map((flag, i) => (
              <li key={`${flag.type}-${i}`}>{flag.message}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="seating-controls">
        <div className="seating-controls__stats">
          <span><strong>{stats.tables}</strong> tables</span>
          <span><strong>{stats.totalSeats}</strong> seats</span>
          <span className="is-green"><strong>{stats.assigned}</strong> seated</span>
          <span className="is-gold"><strong>{stats.unassigned}</strong> need a chair</span>
        </div>

        {chart.tables.length > 0 && (
          <div className="seating-controls__tools">
            <p className="seating-controls__hint">
              {sharedShape && sharedSeats != null ? 'Applies to every table' : 'Tables are mixed — pick a shape or chairs to set all'}
            </p>
            <div className="seating-controls__shapes">
              {tableShapes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`table-shape-option${sharedShape === s.id ? ' is-on' : ''}`}
                  onClick={() => updateAllTables({ shape: s.id })}
                >
                  <em>{s.icon}</em>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="seating-controls__chairs">
              <span>Chairs</span>
              <div className="seat-counter">
                <button
                  type="button"
                  aria-label="Fewer chairs on all tables"
                  onClick={() => updateAllTables({ seats: Math.max(1, (sharedSeats || 10) - 1) })}
                >
                  −
                </button>
                <strong>{sharedSeats != null ? sharedSeats : '—'}</strong>
                <button
                  type="button"
                  aria-label="More chairs on all tables"
                  onClick={() => updateAllTables({ seats: Math.min(20, (sharedSeats || 10) + 1) })}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="seating-layout">
        <div className="seating-canvas-wrap dash-card">
          {groupFilter !== 'All' && (
            <div className="seating-group-filter-banner">
              <span>
                Showing tables for <strong>{groupFilter}</strong>
                {GUEST_GROUP_SUITES[groupFilter]?.length === 1 && (
                  <> · {getSuiteMeta(GUEST_GROUP_SUITES[groupFilter][0]).icon} {getSuiteMeta(GUEST_GROUP_SUITES[groupFilter][0]).label} area</>
                )}
              </span>
              <button type="button" className="seating-group-filter-banner__clear" onClick={() => handleGroupFilterChange('All')}>
                Show all tables
              </button>
            </div>
          )}
          <div className="seating-canvas">
            {chart.tables.length === 0 ? (
              <div className="seating-empty">
                <span>🪑</span>
                <h3>No tables yet</h3>
                <p>Add tables, then choose Bride's Family, Relatives, or another group for each</p>
                <button type="button" className="dash-btn dash-btn--primary" onClick={openAddTable}>+ Add table</button>
              </div>
            ) : filteredSuiteGroups.length === 0 ? (
              <div className="seating-empty">
                <span>🔍</span>
                <h3>No tables for {groupFilter}</h3>
                <p>Try another group or run Auto-seat to place guests at tables.</p>
                <button type="button" className="dash-btn dash-btn--outline" onClick={() => handleGroupFilterChange('All')}>Show all tables</button>
              </div>
            ) : (
              filteredSuiteGroups.map(({ suite, tables }) => (
                <section key={suite.id} className={`seating-suite-zone seating-suite-zone--${suite.id}`}>
                  <header className="seating-suite-zone__head">
                    {suite.icon} {suite.label}
                  </header>
                  <div className="seating-suite-zone__tables">
                    {tables.map((table) => {
                      const fill = chart.getTableFill(table.id);
                      const currentGroup = table.guestGroups?.[0] || '';
                      const selected = selectedTableId === table.id;
                      return (
                        <div
                          key={table.id}
                          className={`seating-table-card seating-table-card--simple${selected ? ' is-selected' : ''}`}
                          onClick={() => setSelectedTableId(selected ? null : table.id)}
                        >
                          <div className="seating-table-card__head">
                            <div>
                              <strong>{table.name}</strong>
                              <small className="seating-table-card__sub">
                                {fill.filled}/{fill.total} seated · {tableShapes.find((s) => s.id === table.shape)?.label || 'Round'} · {table.seats} chairs
                              </small>
                            </div>
                            <div className="seating-table-card__actions" onClick={(e) => e.stopPropagation()}>
                              <button type="button" className="guest-action-btn" onClick={() => openEditTable(table)} title="Edit">✏️</button>
                              <button type="button" className="seating-table-card__remove" onClick={() => removeTable(table.id)} title="Delete">🗑️</button>
                            </div>
                          </div>

                          <TableVisual
                            table={table}
                            assignments={chart.assignments}
                            getGuestName={(id) => chart.getGuestName(id)}
                            selectedGuest={selectedGuest}
                            onSeatClick={handleSeatClick}
                          />

                          <div className="seating-simple-select" onClick={(e) => e.stopPropagation()}>
                            <PrettySelect
                              label="Seat with group"
                              icon="guests"
                              value={currentGroup}
                              placeholder="Choose…"
                              options={[
                                { value: '', label: 'Choose…', icon: 'guests' },
                                ...seatGroups.map((g) => ({
                                  value: g,
                                  label: formatGroupOptionLabel(g, waitingGroupCounts[g] || 0, seatedGroupCounts[g] || 0),
                                  icon: 'guests',
                                })),
                              ]}
                              onChange={(value) => seatTableWithGroup(table.id, value)}
                            />
                          </div>

                          {fill.filled > 0 && (
                            <button type="button" className="seating-clear-link" onClick={(e) => { e.stopPropagation(); clearTable(table.id); }}>
                              Clear this table
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>

        <aside className={`seating-sidebar dash-card${selectedTableDetail ? ' seating-sidebar--table-focus' : ''}`}>
          <h3>Guests</h3>
          <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <PrettySelect
            label="Guest group"
            icon="guests"
            value={groupFilter}
            options={[
              { value: 'All', label: 'All groups', icon: 'guests' },
              ...seatGroups.map((g) => ({
                value: g,
                label: formatGroupOptionLabel(g, waitingGroupCounts[g] || 0, seatedGroupCounts[g] || 0),
                icon: 'guests',
              })),
            ]}
            onChange={handleGroupFilterChange}
          />
          <p className="seating-sidebar__tip">
            {groupFilter !== 'All'
              ? `Floor plan shows ${groupFilter} tables. Numbers are seated vs still waiting for a chair.`
              : selectedTableDetail
                ? 'Guests at the selected table are listed below. Click the table again to show everyone.'
                : 'Pick a group to jump to their tables, or tap a guest then an empty chair.'}
          </p>

          {selectedTableDetail && (
            <div className="seating-sidebar__section seating-table-focus">
              <div className="seating-table-focus__head">
                <div>
                  <h4>{selectedTableDetail.table.name}</h4>
                  <small>
                    {selectedTableDetail.suite.icon} {selectedTableDetail.suite.label}
                    {' · '}
                    {selectedTableDetail.rows.length}/{selectedTableDetail.table.seats} seated
                  </small>
                </div>
                <button type="button" className="seating-table-focus__clear" onClick={() => setSelectedTableId(null)}>
                  Show all
                </button>
              </div>

              {Object.keys(selectedTableDetail.groupCounts).length > 0 ? (
                <div className="seating-table-focus__groups">
                  <span className="seating-table-focus__label">Groups at this table</span>
                  <ul>
                    {Object.entries(selectedTableDetail.groupCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([group, count]) => (
                        <li key={group}>
                          <strong>{group}</strong>
                          <span>{count} guest{count === 1 ? '' : 's'}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : (
                <p className="seating-table-focus__empty">No guests at this table yet.</p>
              )}

              {selectedTableDetail.rows.length > 0 && (
                <ul className="seating-guest-list seating-table-focus__people">
                  {selectedTableDetail.rows.map(({ seat, guest }) => (
                    <li key={guest.id} className="seating-guest-list__assigned seating-table-focus__person">
                      <div>
                        <strong>{guest.name}</strong>
                        <small>Seat {seat} · {guest.group || 'No Group'}</small>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = new SeatingChart(chart.toJSON(), guests);
                          next.unassignGuest(guest.id);
                          persist(next);
                        }}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!selectedTableDetail && (
          <div className="seating-sidebar__section">
            <h4>Need a chair ({filteredUnassigned.length})</h4>
            <ul className="seating-guest-list">
              {filteredUnassigned.length === 0 ? (
                <li className="seating-guest-list__empty"><small>All seated 🎉</small></li>
              ) : filteredUnassigned.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    className={selectedGuest === g.id ? 'is-selected' : ''}
                    onClick={() => setSelectedGuest(selectedGuest === g.id ? null : g.id)}
                  >
                    <strong>{g.name}</strong>
                    <small>{g.group}</small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          )}

          {!selectedTableDetail && (
          <div className="seating-sidebar__section">
            <h4>Seated ({chart.assignedGuests.length})</h4>
            <ul className="seating-guest-list">
              {sidebarSeatedGuests.length === 0 ? (
                <li className="seating-guest-list__empty"><small>None yet</small></li>
              ) : sidebarSeatedGuests.map((g) => {
                const table = chart.getTableForGuest(g.id);
                return (
                  <li key={g.id} className="seating-guest-list__assigned">
                    <div>
                      <strong>{g.name}</strong>
                      <small>{table?.name}</small>
                    </div>
                    <button type="button" onClick={() => {
                      const next = new SeatingChart(chart.toJSON(), guests);
                      next.unassignGuest(g.id);
                      persist(next);
                    }}>✕</button>
                  </li>
                );
              })}
            </ul>
          </div>
          )}
        </aside>
      </div>

      {showTableModal && (
        <div className="dash-overlay" onClick={closeTableModal}>
          <form className="dash-panel dash-panel--center seating-table-modal" onSubmit={submitTable} onClick={(e) => e.stopPropagation()}>
            <h2>{editingTableId ? 'Edit table' : 'Add table'}</h2>

            <div className="seating-modal-preview">
              <TableVisual table={previewTable} compact />
            </div>

            <label className="dash-field">
              <span>Table number</span>
              <input value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} placeholder="1" />
            </label>

            <div className="dash-field">
              <PrettySelect
                label="Area (suite)"
                icon="venue"
                value={tableForm.suite}
                options={tableSuites.map((s) => ({ value: s.id, label: s.label, icon: 'venue' }))}
                onChange={(suite) => setTableForm({ ...tableForm, suite })}
              />
            </div>

            <div className="dash-field">
              <PrettySelect
                label="Priority"
                icon="sparkle"
                value={tableForm.priority}
                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
                  value: n,
                  label: `${n}${n === 1 ? ' — highest' : n === 10 ? ' — lowest' : ''}`,
                  icon: 'sparkle',
                }))}
                onChange={(priority) => setTableForm({ ...tableForm, priority: Number(priority) })}
              />
            </div>

            <label className="dash-field">
              <span>Chairs</span>
              <div className="seat-counter">
                <button type="button" onClick={() => setTableForm({ ...tableForm, seats: Math.max(1, tableForm.seats - 1) })}>−</button>
                <strong>{tableForm.seats}</strong>
                <button type="button" onClick={() => setTableForm({ ...tableForm, seats: Math.min(20, tableForm.seats + 1) })}>+</button>
              </div>
            </label>

            <div className="dash-field">
              <PrettySelect
                label="Default group (optional)"
                icon="guests"
                value={tableForm.guestGroup}
                options={[
                  { value: '', label: 'None', icon: 'guests' },
                  ...seatGroups.map((g) => ({ value: g, label: g, icon: 'guests' })),
                ]}
                onChange={(guestGroup) => setTableForm({ ...tableForm, guestGroup })}
              />
            </div>

            <span className="dash-field"><span>Shape</span></span>
            <div className="table-shape-grid">
              {tableShapes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`table-shape-option${tableForm.shape === s.id ? ' is-on' : ''}`}
                  onClick={() => setTableForm({ ...tableForm, shape: s.id })}
                >
                  <em>{s.icon}</em>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--outline" onClick={closeTableModal}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">{editingTableId ? 'Save' : 'Add table'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SeatingChartPage;
