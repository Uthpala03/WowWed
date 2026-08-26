import { getBudget, getGuests, getSeating, getTasks, getWeddingProfile, getBookings } from '../../utils/storage';
import PageHeader from '../../components/ui/PageHeader';

const reportTypes = [
  { id: 'guests', title: 'Guest List Report', desc: 'All guests with RSVP status and groups' },
  { id: 'budget', title: 'Budget Report', desc: 'Planned vs actual spending by category' },
  { id: 'vendors', title: 'Vendor Report', desc: 'Booking requests and vendor expenses' },
  { id: 'seating', title: 'Seating Report', desc: 'Table assignments and capacity' },
  { id: 'summary', title: 'Full Wedding Summary', desc: 'Complete overview of your wedding plan' },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildReportHtml(type) {
  const profile = getWeddingProfile() || {};
  const guests = getGuests() || [];
  const budget = getBudget() || { total: 0, expenses: [] };
  const tasks = getTasks() || [];
  const seating = getSeating() || { tables: [], assignments: {} };
  const bookings = getBookings() || [];
  const title = reportTypes.find((r) => r.id === type)?.title || 'Report';
  const couple = `${escapeHtml(profile.partnerOne || 'Partner 1')} & ${escapeHtml(profile.partnerTwo || 'Partner 2')}`;
  const date = escapeHtml(String(profile.weddingDate || '').slice(0, 10));

  let body = `<h1>WOWWED — ${escapeHtml(title)}</h1><p>${couple} · ${date}</p><hr/>`;

  if (type === 'guests' || type === 'summary') {
    body += '<h2>Guests</h2><table border="1" cellpadding="6"><tr><th>Name</th><th>Group</th><th>RSVP</th></tr>';
    if (!guests.length) body += '<tr><td colspan="3">No guests yet</td></tr>';
    guests.forEach((g) => {
      body += `<tr><td>${escapeHtml(g.name)}</td><td>${escapeHtml(g.group)}</td><td>${escapeHtml(g.rsvp)}</td></tr>`;
    });
    body += '</table>';
  }
  if (type === 'budget' || type === 'summary') {
    const spent = (budget.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
    body += `<h2>Budget</h2><p>Total: Rs. ${Number(budget.total || 0).toLocaleString()} | Spent: Rs. ${spent.toLocaleString()}</p>`;
  }
  if (type === 'vendors' || type === 'summary') {
    body += `<h2>Vendor Bookings</h2><p>${bookings.length} booking(s) on record</p>`;
  }
  if (type === 'seating' || type === 'summary') {
    const tables = seating.tables || [];
    const assignments = seating.assignments || {};
    body += `<h2>Seating</h2><p>${tables.length} tables · ${Object.keys(assignments).length} seats assigned</p>`;
  }
  if (type === 'summary') {
    const done = tasks.filter((t) => t.done).length;
    body += `<h2>Checklist</h2><p>${done}/${tasks.length} tasks completed</p>`;
  }

  return `<html><head><title>${escapeHtml(title)}</title><style>body{font-family:Georgia,sans-serif;padding:40px;color:#5c3d2e}h1{color:#d4896a}</style></head><body>${body}</body></html>`;
}

function ReportsPage() {
  const download = (type) => {
    const w = window.open('', '_blank');
    if (!w) {
      window.alert('Please allow pop-ups to print this report.');
      return;
    }
    w.document.write(buildReportHtml(type));
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="dash-page">
      <PageHeader moduleId="reports" title="PDF Reports" />
      <div className="reports-grid">
        {reportTypes.map((r) => (
          <article key={r.id} className="dash-card report-card">
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <button type="button" className="dash-btn dash-btn--primary" onClick={() => download(r.id)}>Download PDF</button>
          </article>
        ))}
      </div>
    </div>
  );
}

export default ReportsPage;
