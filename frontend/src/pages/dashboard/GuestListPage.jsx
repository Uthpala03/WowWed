import { useMemo, useState } from 'react';
import { guestGroups, rsvpStatuses } from '../../data/dashboardData';
import { getGuests, saveGuests } from '../../utils/storage';

const emptyGuest = { name: '', email: '', phone: '', group: 'No Group', rsvp: 'Pending', notes: '' };

function GuestListPage() {
  const [guests, setGuests] = useState(() => getGuests());
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All Groups');
  const [rsvpFilter, setRsvpFilter] = useState('All Statuses');
  const [view, setView] = useState('list');
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState(emptyGuest);

  const stats = useMemo(() => ({
    total: guests.length,
    pending: guests.filter((g) => g.rsvp === 'Pending').length,
    accepted: guests.filter((g) => g.rsvp === 'Accepted').length,
    declined: guests.filter((g) => g.rsvp === 'Rejected' || g.rsvp === 'Declined').length,
  }), [guests]);

  const filtered = guests.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || g.phone.includes(q);
    const matchGroup = groupFilter === 'All Groups' || g.group === groupFilter;
    const matchRsvp = rsvpFilter === 'All Statuses' || g.rsvp === rsvpFilter;
    return matchSearch && matchGroup && matchRsvp;
  });

  const persist = (next) => {
    setGuests(next);
    saveGuests(next);
  };

  const openAdd = () => {
    setForm(emptyGuest);
    setPanelOpen(true);
  };

  const submitGuest = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    persist([...guests, { ...form, id: `g${Date.now()}` }]);
    setPanelOpen(false);
    setForm(emptyGuest);
  };

  const removeGuest = (id) => persist(guests.filter((g) => g.id !== id));

  const importCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).filter(Boolean);
      const imported = lines.slice(1).map((line, i) => {
        const [name, email, phone, group, rsvp] = line.split(',').map((s) => s.trim());
        return { id: `g${Date.now()}${i}`, name: name || `Guest ${i}`, email: email || '', phone: phone || '', group: group || 'No Group', rsvp: rsvp || 'Pending', notes: '' };
      }).filter((g) => g.name);
      if (imported.length) persist([...guests, ...imported]);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="dash-page">
      <header className="dash-page__header">
        <div>
          <h1>Guest List</h1>
          <p>Manage your wedding guests and track RSVPs</p>
        </div>
        <div className="dash-page__actions">
          <label className="dash-btn dash-btn--outline csv-upload">
            Import CSV
            <input type="file" accept=".csv" hidden onChange={importCsv} />
          </label>
          <button type="button" className="dash-btn dash-btn--outline">Add Many</button>
          <button type="button" className="dash-btn dash-btn--primary" onClick={openAdd}>+ Add Guest</button>
        </div>
      </header>

      <div className="guest-stats">
        <div className="guest-stat"><strong>{stats.total}</strong><span>Total Guests</span></div>
        <div className="guest-stat guest-stat--gold"><strong>{stats.pending}</strong><span>Pending RSVP</span></div>
        <div className="guest-stat guest-stat--green"><strong>{stats.accepted}</strong><span>Coming</span></div>
        <div className="guest-stat guest-stat--red"><strong>{stats.declined}</strong><span>Not coming</span></div>
      </div>

      <div className="guest-toolbar">
        <button type="button" className="dash-btn dash-btn--white">Filters</button>
        <div className="view-toggle">
          <button type="button" className={view === 'list' ? 'is-on' : ''} onClick={() => setView('list')}>List</button>
          <button type="button" className={view === 'table' ? 'is-on' : ''} onClick={() => setView('table')}>Table</button>
        </div>
      </div>

      <div className="guest-filters dash-card">
        <input placeholder="Search by name, email, or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          <option>All Groups</option>
          {guestGroups.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select value={rsvpFilter} onChange={(e) => setRsvpFilter(e.target.value)}>
          <option>All Statuses</option>
          {rsvpStatuses.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="dash-card guest-list-body">
        {filtered.length === 0 ? (
          <div className="dash-empty">
            <h3>No guests found</h3>
            <p>Add your first guest to get started!</p>
            <button type="button" className="dash-btn dash-btn--primary" onClick={openAdd}>Add Guest</button>
          </div>
        ) : view === 'table' ? (
          <table className="guest-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Group</th><th>RSVP</th><th /></tr></thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id}>
                  <td>{g.name}</td><td>{g.email}</td><td>{g.phone}</td><td>{g.group}</td>
                  <td><span className={`rsvp-badge rsvp-badge--${g.rsvp.toLowerCase()}`}>{g.rsvp}</span></td>
                  <td><button type="button" onClick={() => removeGuest(g.id)}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ul className="guest-cards">
            {filtered.map((g) => (
              <li key={g.id} className="guest-card-item">
                <div><strong>{g.name}</strong><small>{g.email}</small></div>
                <span>{g.group}</span>
                <span className={`rsvp-badge rsvp-badge--${g.rsvp.toLowerCase()}`}>{g.rsvp}</span>
                <button type="button" onClick={() => removeGuest(g.id)}>🗑️</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {panelOpen && (
        <div className="dash-overlay">
          <form className="dash-panel dash-panel--side" onSubmit={submitGuest}>
            <h2>Add Guest</h2>
            <label className="dash-field"><span>Name *</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="dash-field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="dash-field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="dash-field"><span>Group</span>
              <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
                {guestGroups.map((g) => <option key={g}>{g}</option>)}
              </select>
            </label>
            <label className="dash-field"><span>RSVP Status</span>
              <select value={form.rsvp} onChange={(e) => setForm({ ...form, rsvp: e.target.value })}>
                {rsvpStatuses.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="dash-field"><span>Notes</span><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setPanelOpen(false)}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">Add Guest</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default GuestListPage;
