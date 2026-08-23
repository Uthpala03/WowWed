import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TableVisual from '../../components/seating/TableVisual';
import { guestGroups, tableShapes } from '../../data/dashboardData';
import { SeatingChart, Table, tableSuites } from '../../models/Seating';
import { getGuests, getSeating, saveSeating } from '../../utils/storage';
import PageHeader from '../../components/ui/PageHeader';

const emptyTableForm = {
  name: '',
  seats: 6,
  shape: 'round',
  suite: 'general',
  priority: 5,
  guestGroup: '',
};

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
  const groupCounts = useMemo(() => chart.getGroupCounts(), [chart]);
  const seatGroups = guestGroups.filter((g) => g !== 'No Group');

  const filteredUnassigned = chart.waitingToSeat.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.name.toLowerCase().includes(q);
    const matchGroup = groupFilter === 'All' || g.group === groupFilter;
    return matchSearch && matchGroup;
  });

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

  const comingCount = guests.filter((g) => {
    const v = (g.rsvp || '').trim().toLowerCase();
    return ['accepted', 'coming', 'yes', 'y'].includes(v);
  }).length;

  const tablesForComing = () => {
    const workTables = chart.tables.map((t) => t.toJSON());
    let seatCount = workTables.reduce((sum, t) => sum + Number(t.seats || 0), 0);
    let nextNum = workTables.length + 1;
    while (seatCount < comingCount) {
      workTables.push({
        id: `table-auto-${nextNum}`,
        name: `Table ${nextNum}`,
        seats: 10,
        shape: 'round',
        suite: 'general',
        priority: 5,
        guestGroups: [],
      });
      seatCount += 10;
      nextNum += 1;
    }
    return workTables;
  };

  const runAutoSeat = async () => {
    showToast('Smart seating running...');
    const workTables = tablesForComing();
    try {
      const res = await fetch('http://127.0.0.1:8000/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

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
        seated += 1;
      });

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
          <div className="seating-canvas">
            {chart.tables.length === 0 ? (
              <div className="seating-empty">
                <span>🪑</span>
                <h3>No tables yet</h3>
                <p>Add tables, then choose Bride's Family, Relatives, or another group for each</p>
                <button type="button" className="dash-btn dash-btn--primary" onClick={openAddTable}>+ Add table</button>
              </div>
            ) : (
              suiteGroups.map(({ suite, tables }) => (
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
                          onClick={() => setSelectedTableId(table.id)}
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

                          <label className="seating-simple-select" onClick={(e) => e.stopPropagation()}>
                            <span>Seat with group:</span>
                            <select
                              value={currentGroup}
                              onChange={(e) => seatTableWithGroup(table.id, e.target.value)}
                            >
                              <option value="">Choose…</option>
                              {seatGroups.map((g) => (
                                <option key={g} value={g}>{g} ({groupCounts[g] || 0} waiting)</option>
                              ))}
                            </select>
                          </label>

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

        <aside className="seating-sidebar dash-card">
          <h3>Guests</h3>
          <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
            <option>All</option>
            {seatGroups.map((g) => (
              <option key={g} value={g}>{g} ({groupCounts[g] || 0})</option>
            ))}
          </select>
          <p className="seating-sidebar__tip">Or tap a guest, then tap an empty chair</p>

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

          <div className="seating-sidebar__section">
            <h4>Seated ({chart.assignedGuests.length})</h4>
            <ul className="seating-guest-list">
              {chart.assignedGuests.length === 0 ? (
                <li className="seating-guest-list__empty"><small>None yet</small></li>
              ) : chart.assignedGuests.map((g) => {
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

            <label className="dash-field">
              <span>Area (suite)</span>
              <select value={tableForm.suite} onChange={(e) => setTableForm({ ...tableForm, suite: e.target.value })}>
                {tableSuites.map((s) => (
                  <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                ))}
              </select>
            </label>

            <label className="dash-field">
              <span>Priority (1 = best seats)</span>
              <select value={tableForm.priority} onChange={(e) => setTableForm({ ...tableForm, priority: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{n}{n === 1 ? ' — highest' : n === 10 ? ' — lowest' : ''}</option>
                ))}
              </select>
            </label>

            <label className="dash-field">
              <span>Chairs</span>
              <div className="seat-counter">
                <button type="button" onClick={() => setTableForm({ ...tableForm, seats: Math.max(1, tableForm.seats - 1) })}>−</button>
                <strong>{tableForm.seats}</strong>
                <button type="button" onClick={() => setTableForm({ ...tableForm, seats: Math.min(20, tableForm.seats + 1) })}>+</button>
              </div>
            </label>

            <label className="dash-field">
              <span>Default group (optional)</span>
              <select value={tableForm.guestGroup} onChange={(e) => setTableForm({ ...tableForm, guestGroup: e.target.value })}>
                <option value="">None</option>
                {seatGroups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>

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
