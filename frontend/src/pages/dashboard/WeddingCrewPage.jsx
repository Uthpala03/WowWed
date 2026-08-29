import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { crewRoles } from '../../data/dashboardData';
import { getCrew, saveCrew } from '../../utils/storage';
import PageHeader from '../../components/ui/PageHeader';
import PrettySelect from '../../components/ui/PrettySelect';

function WeddingCrewPage() {
  const coupleData = useOutletContext();
  const [crew, setCrew] = useState(() => getCrew() || coupleData?.crew || []);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Bridesmaid');
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setCrew(getCrew() || coupleData?.crew || []);
  }, [coupleData]);

  const persistCrew = async (next) => {
    setCrew(next);
    setSaving(true);
    setSaveError('');
    try {
      await saveCrew(next);
    } catch (err) {
      setSaveError(err.message || 'Could not save to your account. Try again.');
      setCrew(getCrew() || coupleData?.crew || []);
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    const next = [...crew, { id: `cr${Date.now()}`, name: name.trim(), role }];
    await persistCrew(next);
    setName('');
    setRole('Bridesmaid');
    setPanelOpen(false);
  };

  const remove = async (id) => {
    if (saving) return;
    const next = crew.filter((m) => m.id !== id);
    await persistCrew(next);
  };

  return (
    <div className="dash-page">
      <PageHeader moduleId="crew">
        <button type="button" className="dash-btn dash-btn--primary" onClick={() => setPanelOpen(true)} disabled={saving}>
          + Add Member
        </button>
      </PageHeader>

      {saveError && (
        <div className="dash-alert dash-alert--danger">
          <strong>Could not save crew member</strong>
          <p>{saveError}</p>
        </div>
      )}

      <div className="dash-card">
        {crew.length === 0 ? (
          <div className="dash-empty">
            <h3>No crew members yet</h3>
            <p>Add your bridal party, groomsmen, and helpers</p>
            <button type="button" className="dash-btn dash-btn--primary" onClick={() => setPanelOpen(true)} disabled={saving}>
              Add Member
            </button>
          </div>
        ) : (
          <ul className="crew-list">
            {crew.map((m) => (
              <li key={m.id}>
                <span className="dash-list-avatar">{m.name.charAt(0).toUpperCase()}</span>
                <div>
                  <strong>{m.name}</strong>
                  <span className="guest-group-badge">{m.role}</span>
                </div>
                <button
                  type="button"
                  className="guest-action-btn guest-action-btn--danger"
                  onClick={() => remove(m.id)}
                  title="Remove"
                  disabled={saving}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {panelOpen && (
        <div className="dash-overlay" onClick={() => !saving && setPanelOpen(false)}>
          <form className="dash-panel dash-panel--side" onSubmit={addMember} onClick={(e) => e.stopPropagation()}>
            <h2>Add Crew Member</h2>
            <label className="dash-field">
              <span>Name *</span>
              <input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
            </label>
            <div className="dash-field">
              <PrettySelect
                label="Role"
                icon="crew"
                value={role}
                options={crewRoles.map((r) => ({ value: r, label: r, icon: 'crew' }))}
                onChange={setRole}
              />
            </div>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setPanelOpen(false)} disabled={saving}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary" disabled={saving}>
                {saving ? 'Saving…' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default WeddingCrewPage;
