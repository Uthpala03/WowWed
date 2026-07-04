import { useState } from 'react';
import { crewRoles } from '../../data/dashboardData';
import { getCrew, saveCrew } from '../../utils/storage';

function WeddingCrewPage() {
  const [crew, setCrew] = useState(() => getCrew());
  const [name, setName] = useState('');
  const [role, setRole] = useState('Bridesmaid');
  const [panelOpen, setPanelOpen] = useState(false);

  const addMember = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const next = [...crew, { id: `cr${Date.now()}`, name: name.trim(), role }];
    setCrew(next);
    saveCrew(next);
    setName('');
    setPanelOpen(false);
  };

  const remove = (id) => {
    const next = crew.filter((m) => m.id !== id);
    setCrew(next);
    saveCrew(next);
  };

  return (
    <div className="dash-page">
      <header className="dash-page__header">
        <div>
          <h1>Wedding Crew</h1>
          <p>Manage your bridal party and wedding helpers</p>
        </div>
        <button type="button" className="dash-btn dash-btn--primary" onClick={() => setPanelOpen(true)}>+ Add Member</button>
      </header>

      <div className="dash-card">
        {crew.length === 0 ? (
          <div className="dash-empty">
            <h3>No crew members yet</h3>
            <p>Add your bridal party, groomsmen, and helpers</p>
            <button type="button" className="dash-btn dash-btn--primary" onClick={() => setPanelOpen(true)}>Add Member</button>
          </div>
        ) : (
          <ul className="crew-list">
            {crew.map((m) => (
              <li key={m.id}>
                <div>
                  <strong>{m.name}</strong>
                  <small>{m.role}</small>
                </div>
                <button type="button" onClick={() => remove(m.id)} title="Remove">🗑️</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {panelOpen && (
        <div className="dash-overlay" onClick={() => setPanelOpen(false)}>
          <form className="dash-panel dash-panel--side" onSubmit={addMember} onClick={(e) => e.stopPropagation()}>
            <h2>Add Crew Member</h2>
            <label className="dash-field">
              <span>Name *</span>
              <input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="dash-field">
              <span>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {crewRoles.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setPanelOpen(false)}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">Add Member</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default WeddingCrewPage;
