import { getBudget, getGuests, getSeating, getTasks, getWeddingProfile, getBookings } from '../../utils/storage';

const reportTypes = [
  { id: 'guests', title: 'Guest List Report', desc: 'All guests with RSVP status and groups' },
  { id: 'budget', title: 'Budget Report', desc: 'Planned vs actual spending by category' },
  { id: 'vendors', title: 'Vendor Report', desc: 'Booking requests and vendor expenses' },
  { id: 'seating', title: 'Seating Report', desc: 'Table assignments and capacity' },
  { id: 'summary', title: 'Full Wedding Summary', desc: 'Complete overview of your wedding plan' },
];

function buildReportHtml(type) {
  const profile = getWeddingProfile();
  const guests = getGuests();
  const budget = getBudget();
  const tasks = getTasks() || [];
  const seating = getSeating();
  const bookings = getBookings();
  const title = reportTypes.find((r) => r.id === type)?.title || 'Report';

  let body = `<h1>WOWWED — ${title}</h1><p>${profile?.partnerOne} & ${profile?.partnerTwo} · ${profile?.weddingDate || ''}</p><hr/>`;

  if (type === 'guests' || type === 'summary') {
    body += '<h2>Guests</h2><table border="1" cellpadding="6"><tr><th>Name</th><th>Group</th><th>RSVP</th></tr>';
    guests.forEach((g) => { body += `<tr><td>${g.name}</td><td>${g.group}</td><td>${g.rsvp}</td></tr>`; });
    body += '</table>';
  }
  if (type === 'budget' || type === 'summary') {
    const spent = (budget?.expenses || []).reduce((s, e) => s + Number(e.amount), 0);
    body += `<h2>Budget</h2><p>Total: Rs. ${budget?.total?.toLocaleString()} | Spent: Rs. ${spent.toLocaleString()}</p>`;
  }
  if (type === 'vendors' || type === 'summary') {
    body += `<h2>Vendor Bookings</h2><p>${bookings.length} booking(s) on record</p>`;
  }
  if (type === 'seating' || type === 'summary') {
    body += `<h2>Seating</h2><p>${seating.tables.length} tables · ${Object.keys(seating.assignments).length} seats assigned</p>`;
  }
  if (type === 'summary') {
    const done = tasks.filter((t) => t.done).length;
    body += `<h2>Checklist</h2><p>${done}/${tasks.length} tasks completed</p>`;
  }

  return `<html><head><title>${title}</title><style>body{font-family:Georgia,sans-serif;padding:40px;color:#5c3d2e}h1{color:#d4896a}</style></head><body>${body}</body></html>`;
}

function ReportsPage() {
  const download = (type) => {
    const w = window.open('', '_blank');
    w.document.write(buildReportHtml(type));
    w.document.close();
    w.print();
  };

  return (
    <div className="dash-page">
      <header className="dash-page__header">
        <div>
          <h1>PDF Reports</h1>
          <p>One-click exports for your wedding documents (M17)</p>
        </div>
      </header>
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
