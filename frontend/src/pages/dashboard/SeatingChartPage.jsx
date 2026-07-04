import { useMemo, useState } from 'react';
import { tableShapes } from '../../data/dashboardData';
import { getGuests, getSeating, saveSeating } from '../../utils/storage';
import { generateSmartSeating } from '../../utils/smartSeating';

const emptyTableForm = { name: '', seats: 6, shape: 'round' };

function SeatingChartPage() {
  const guests = getGuests();
  const [seating, setSeating] = useState(() => getSeating());
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [search, setSearch] = useState('');
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableForm, setTableForm] = useState(emptyTableForm);
  const [zoom, setZoom] = useState(1);

  const persist = (next) => {
    setSeating(next);
    saveSeating(next);
  };

  const openAddTable = () => {
    const num = seating.tables.length + 1;
    setTableForm({ name: String(num), seats: 6, shape: 'round' });
    setShowTableModal(true);
  };

  const submitTable = (e) => {
    e.preventDefault();
    const num = seating.tables.length + 1;
    persist({
      ...seating,
      tables: [...seating.tables, {
        id: `table-${num}`,
        name: `Table ${tableForm.name || num}`,
        seats: tableForm.seats,
        shape: tableForm.shape,
      }],
    });
    setShowTableModal(false);
    setTableForm(emptyTableForm);
  };

  const assignGuest = (tableId, seatIndex) => {
    if (!selectedGuest) return;
    persist({
      ...seating,
      assignments: { ...seating.assignments, [`${tableId}-${seatIndex}`]: selectedGuest },
    });
    setSelectedGuest(null);
  };

  const removeAssignment = (guestId) => {
    const assignments = { ...seating.assignments };
    Object.keys(assignments).forEach((key) => {
      if (assignments[key] === guestId) delete assignments[key];
    });
    persist({ ...seating, assignments });
  };

  const unassigned = guests.filter((g) => !Object.values(seating.assignments).includes(g.id));
  const assigned = guests.filter((g) => Object.values(seating.assignments).includes(g.id));
  const filteredUnassigned = unassigned.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  const getGuestName = (id) => guests.find((g) => g.id === id)?.name || '';
  const getTableForGuest = (guestId) => {
    const entry = Object.entries(seating.assignments).find(([, id]) => id === guestId);
    if (!entry) return '';
    const tableId = entry[0].split('-')[0];
    return seating.tables.find((t) => t.id === tableId)?.name || '';
  };

  const stats = useMemo(() => ({
    tables: seating.tables.length,
    guests: guests.length,
    assigned: assigned.length,
  }), [seating, guests, assigned]);

  const runSmartSeating = () => {
    const accepted = guests.filter((g) => g.rsvp !== 'Rejected' && g.rsvp !== 'Declined');
    const { assignments, conflicts } = generateSmartSeating(accepted, seating.tables);
    persist({ ...seating, assignments });
    if (conflicts.length) window.alert(conflicts.join('\n'));
  };

  return (
    <div className="dash-page dash-page--seating">
      <header className="dash-page__header">
        <div>
          <h1>Seating Chart</h1>
          <p>Plan your wedding reception layout</p>
        </div>
        <div className="dash-page__actions">
          <button type="button" className="dash-btn dash-btn--outline" onClick={runSmartSeating}>Generate smart seating</button>
          <button type="button" className="dash-btn dash-btn--primary">Share Chart</button>
        </div>
      </header>

      <div className="seating-layout">
        <div className="seating-canvas-wrap dash-card">
          <div className="seating-toolbar">
            <label className="dash-toggle"><input type="checkbox" /> Show Groups</label>
            <button type="button" className="dash-btn dash-btn--primary" onClick={openAddTable}>Add Table</button>
          </div>
          <div className="seating-canvas" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            {seating.tables.length === 0 ? (
              <div className="dash-empty"><p>Add your first table to start seating</p></div>
            ) : seating.tables.map((table) => (
              <div key={table.id} className="seating-table">
                <div className="seating-table__label">{table.name}</div>
                <div className="seating-table__seats">
                  {Array.from({ length: table.seats }).map((_, i) => {
                    const key = `${table.id}-${i}`;
                    const guestId = seating.assignments[key];
                    const isTarget = selectedGuest && !guestId;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`seat${guestId ? ' is-filled' : ''}${isTarget ? ' is-target' : ''}`}
                        onClick={() => assignGuest(table.id, i)}
                        title={guestId ? getGuestName(guestId) : 'Empty seat'}
                      >
                        {guestId ? getGuestName(guestId).slice(0, 1) : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="seating-zoom">
            <button type="button" onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))}>+</button>
            <button type="button" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.6))}>−</button>
            <button type="button" onClick={() => setZoom(1)}>⊕</button>
          </div>
          <p className="seating-hint">
            {selectedGuest
              ? `Selected: ${getGuestName(selectedGuest)} — Click a chair to assign`
              : 'Select a guest from the right panel'}
          </p>
        </div>

        <aside className="seating-sidebar dash-card">
          <input placeholder="Search guests..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="button" className="dash-btn dash-btn--white" style={{ width: '100%', marginBottom: '0.75rem' }}>Show Filters</button>
          <h3>Unassigned ({filteredUnassigned.length})</h3>
          <ul className="seating-guest-list">
            {filteredUnassigned.map((g) => (
              <li key={g.id} className={selectedGuest === g.id ? 'is-selected' : ''}>
                <button type="button" onClick={() => setSelectedGuest(g.id)} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', flex: 1 }}>
                  <strong>{g.name}</strong>
                  <small>{g.group || 'Uncategorized'}</small>
                </button>
                <div className="seating-guest-actions">
                  <button type="button" title="Select">✓</button>
                  <button type="button" title="Remove">🗑️</button>
                </div>
              </li>
            ))}
          </ul>
          <h3>Assigned ({assigned.length})</h3>
          <ul className="seating-guest-list">
            {assigned.length === 0 ? (
              <li style={{ background: 'transparent', border: 'none' }}><small>No assigned guests found.</small></li>
            ) : assigned.map((g) => (
              <li key={g.id}>
                <div>
                  <strong>{g.name}</strong>
                  <small>{getTableForGuest(g.id)}</small>
                </div>
                <div className="seating-guest-actions">
                  <button type="button" onClick={() => removeAssignment(g.id)} title="Unassign">🗑️</button>
                </div>
              </li>
            ))}
          </ul>
          <footer>Tables: {stats.tables} | Guests: {stats.guests} | Assigned: {stats.assigned}</footer>
        </aside>
      </div>

      {showTableModal && (
        <div className="dash-overlay" onClick={() => setShowTableModal(false)}>
          <form className="dash-panel dash-panel--center" onSubmit={submitTable} onClick={(e) => e.stopPropagation()}>
            <h2>Add New Table</h2>
            <p className="dash-panel__title">Table {tableForm.name || seating.tables.length + 1}</p>
            <div className="table-modal-preview" />
            <label className="dash-field">
              <span>Table Number/ID</span>
              <input value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} />
            </label>
            <label className="dash-field">
              <span>Number of Seats</span>
              <div className="seat-counter">
                <button type="button" onClick={() => setTableForm({ ...tableForm, seats: Math.max(2, tableForm.seats - 1) })}>−</button>
                <strong>{tableForm.seats}</strong>
                <button type="button" onClick={() => setTableForm({ ...tableForm, seats: Math.min(20, tableForm.seats + 1) })}>+</button>
              </div>
            </label>
            <span className="dash-field"><span>Table Shape</span></span>
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
              <button type="button" className="dash-btn dash-btn--outline" onClick={() => setShowTableModal(false)}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">Add Table</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SeatingChartPage;
