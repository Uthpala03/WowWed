import { useMemo, useState } from 'react';
import TableVisual from '../../components/seating/TableVisual';
import { guestGroups, tableShapes } from '../../data/dashboardData';
import { SeatingChart, Table, tableSuites } from '../../models/Seating';
import { getGuests, getSeating, saveSeating } from '../../utils/storage';

const emptyTableForm = {
  name: '',
  seats: 6,
  shape: 'round',
  suite: 'general',
  priority: 5,
  guestGroup: '',
};

function SeatingChartPage() {
  const guests = getGuests();
  const [chart, setChart] = useState(() => new SeatingChart(getSeating(), guests));
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTableId, setEditingTableId] = useState(null);
  const [tableForm, setTableForm] = useState(emptyTableForm);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const persist = (nextChart) => {
    setChart(nextChart);
    saveSeating(nextChart.toJSON());
  };

  const stats = useMemo(() => chart.stats, [chart]);
  const suiteGroups = useMemo(() => chart.tablesBySuite, [chart]);
  const groupCounts = useMemo(() => chart.getGroupCounts(), [chart]);
  const seatGroups = guestGroups.filter((g) => g !== 'No Group');

  const filteredUnassigned = chart.unassignedGuests.filter((g) => {
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

  const runAutoSeat = () => {
    const next = new SeatingChart(chart.toJSON(), guests);
    const { filled, conflicts } = next.autoSeatAll();
    persist(next);
    showToast(conflicts.length ? conflicts[0] : `${filled} guests seated automatically`);
  };

  const removeTable = (tableId) => {
    const next = new SeatingChart(chart.toJSON(), guests);
    next.removeTable(tableId);
    persist(next);
  };

  return (
    <div className="dash-page dash-page--seating">
      <header className="dash-page__header">
        <div>
          <h1>Seating Chart</h1>
          <p>Arrange tables by area — seat guests in one click</p>
        </div>
        <div className="dash-page__actions">
          <button type="button" className="dash-btn dash-btn--outline" onClick={runAutoSeat}>Auto-seat all</button>
          <button type="button" className="dash-btn dash-btn--primary" onClick={openAddTable}>+ Add table</button>
        </div>
      </header>

      {toast && <div className="guest-import-toast">{toast}</div>}

      <section className="seating-help-banner seating-help-banner--simple">
        <span>💡</span>
        <p>Pick a group from each table&apos;s dropdown to seat guests. Use <strong>Auto-seat all</strong> for everything at once.</p>
      </section>

      <div className="seating-stats">
        <div className="seating-stat"><strong>{stats.tables}</strong><span>Tables</span></div>
        <div className="seating-stat"><strong>{stats.totalSeats}</strong><span>Seats</span></div>
        <div className="seating-stat seating-stat--green"><strong>{stats.assigned}</strong><span>Seated</span></div>
        <div className="seating-stat seating-stat--gold"><strong>{stats.unassigned}</strong><span>Waiting</span></div>
      </div>

      <div className="seating-layout">
        <div className="seating-canvas-wrap dash-card">
          <div className="seating-canvas">
            {chart.tables.length === 0 ? (
              <div className="seating-empty">
                <span>🪑</span>
                <h3>No tables yet</h3>
                <p>Add tables, then choose Family, Friends, or another group for each</p>
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
                      return (
                        <div key={table.id} className="seating-table-card seating-table-card--simple">
                          <div className="seating-table-card__head">
                            <div>
                              <strong>{table.name}</strong>
                              <small className="seating-table-card__sub">
                                {fill.filled}/{fill.total} seated · Priority {table.priority}
                              </small>
                            </div>
                            <div className="seating-table-card__actions">
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

                          <label className="seating-simple-select">
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
                            <button type="button" className="seating-clear-link" onClick={() => clearTable(table.id)}>
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
              <option key={g}>{g} ({groupCounts[g] || 0})</option>
            ))}
          </select>
          <p className="seating-sidebar__tip">Or tap a guest, then tap an empty chair</p>

          <div className="seating-sidebar__section">
            <h4>Waiting ({filteredUnassigned.length})</h4>
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
                  {s.icon}<br />{s.label}
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
