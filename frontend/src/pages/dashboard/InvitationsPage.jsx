import { useState } from 'react';
import { getInvitation, getWeddingProfile, saveInvitation } from '../../utils/storage';
import PageHeader from '../../components/ui/PageHeader';

const templates = [
  { id: 'classic', name: 'Classic Elegance', color: '#5c3d2e' },
  { id: 'floral', name: 'Floral Garden', color: '#6b9e78' },
  { id: 'modern', name: 'Modern Minimal', color: '#7a9eb8' },
  { id: 'poruwa', name: 'Poruwa Traditional', color: '#d4896a' },
];

function InvitationsPage() {
  const profile = getWeddingProfile();
  const [form, setForm] = useState(() => getInvitation() || {
    template: 'classic',
    message: 'We joyfully invite you to celebrate our wedding day.',
    font: 'serif',
  });

  const save = () => {
    saveInvitation({ ...form, updatedAt: new Date().toISOString() });
  };

  const exportPdf = () => {
    const w = window.open('', '_blank');
    const t = templates.find((x) => x.id === form.template);
    w.document.write(`<html><head><title>Invitation</title></head><body style="font-family:Georgia;text-align:center;padding:60px;color:${t?.color}">
      <h1>${profile?.partnerOne || 'Partner 1'} & ${profile?.partnerTwo || 'Partner 2'}</h1>
      <p>${form.message}</p>
      <p><strong>${profile?.weddingDate || 'Date TBA'}</strong></p>
      <p>${profile?.venue || 'Venue TBA'} · ${profile?.district || ''}</p>
    </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="dash-page">
      <PageHeader moduleId="invitations" title="Invitation Designer">
        <button type="button" className="dash-btn dash-btn--primary" onClick={exportPdf}>Export PDF</button>
      </PageHeader>

      <div className="invite-layout">
        <div className="dash-card">
          <h2>Templates</h2>
          <div className="invite-templates">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`invite-template${form.template === t.id ? ' is-on' : ''}`}
                style={{ borderColor: t.color }}
                onClick={() => setForm({ ...form, template: t.id })}
              >
                {t.name}
              </button>
            ))}
          </div>
          <label className="dash-field">
            <span>Message</span>
            <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </label>
          <button type="button" className="dash-btn dash-btn--primary" onClick={save}>Save design</button>
        </div>
        <div className="dash-card invite-preview" style={{ color: templates.find((t) => t.id === form.template)?.color }}>
          <p className="invite-preview__names">{profile?.partnerOne || 'Partner 1'} & {profile?.partnerTwo || 'Partner 2'}</p>
          <p>{form.message}</p>
          <p><strong>{profile?.weddingDate || 'Date'}</strong></p>
          <p>{profile?.venue || 'Venue'} · {profile?.ceremonyType}</p>
        </div>
      </div>
    </div>
  );
}

export default InvitationsPage;
