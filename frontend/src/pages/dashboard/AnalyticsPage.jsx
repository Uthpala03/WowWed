import { Link, useOutletContext } from 'react-router-dom';
import { getBookings, getBudget, getGuests, getProfileBudget, getSeating, getTasks, getWeddingProfile } from '../../utils/storage';
import { computeReadiness } from '../../utils/readiness';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import AppIcon from '../../components/ui/AppIcon';

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-LK', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const diff = new Date(dateString) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function AnalyticsPage() {
  const coupleData = useOutletContext();
  const { user } = useAuth();
  const profile = coupleData?.profile || getWeddingProfile();
  const onboarding = coupleData?.onboarding;
  const tasks = coupleData?.tasks || getTasks() || [];
  const guests = coupleData?.guests || getGuests() || [];
  const budget = coupleData?.budget || getBudget();
  const bookings = coupleData?.bookings || getBookings() || [];
  const crew = coupleData?.crew || [];
  const seating = coupleData?.seating || getSeating() || {};
  const seatingQuality = seating.mlQuality;
  const profileBudget = getProfileBudget() || Number(profile?.budget) || Number(budget?.total) || 0;

  const rejected = guests.filter((g) => g.rsvp === 'Rejected').length;
  const pending = guests.filter((g) => g.rsvp === 'Pending').length;
  const spent = (budget?.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const { score: readiness, taskPct, guestPct, budgetPct, done, accepted, status } = computeReadiness({ tasks, guests, budget });

  const rsvpTotal = Math.max(guests.length, 1);
  const categories = budget?.categories || [];
  const weddingDate = profile?.weddingDate || onboarding?.weddingDate;
  const countdown = daysUntil(weddingDate);
  const coupleName = profile?.partnerOne && profile?.partnerTwo
    ? `${profile.partnerOne} & ${profile.partnerTwo}`
    : user?.fullName || 'Your wedding';

  const summaryItems = [
    { icon: 'calendar', label: 'Wedding date', value: formatDate(weddingDate), extra: countdown != null ? `${countdown} days to go` : null },
    { icon: 'pin', label: 'District', value: profile?.district || onboarding?.location || 'Not set' },
    { icon: 'church', label: 'Ceremony', value: profile?.ceremonyType || 'Not set' },
    { icon: 'guests', label: 'Expected guests', value: profile?.guestCount ? String(profile.guestCount) : `${guests.length} on list` },
    { icon: 'budget', label: 'Your budget', value: profileBudget ? money(profileBudget) : 'Not set' },
    { icon: 'budget', label: 'Wedding scale', value: profile?.scale ? String(profile.scale).replace(/^\w/, (c) => c.toUpperCase()) : 'Standard' },
    { icon: 'checklist', label: 'Checklist', value: `${done} / ${tasks.length} done`, extra: `${taskPct}% complete` },
    { icon: 'guests', label: 'Guest list', value: `${guests.length} total`, extra: `${accepted} accepted · ${pending} pending` },
    { icon: 'budget', label: 'Budget spent', value: money(spent), extra: profileBudget ? `${money(profileBudget - spent)} left` : null },
    { icon: 'vendors', label: 'Vendor bookings', value: String(bookings.length) },
    { icon: 'seating', label: 'Seating tables', value: String((seating.tables || []).length), extra: seatingQuality ? `${seatingQuality.assigned || 0} guests seated` : null },
    { icon: 'crew', label: 'Wedding crew', value: String(crew.length) },
  ];

  return (
    <div className="dash-page">
      <PageHeader moduleId="analytics" title="Analytics Dashboard">
        <span className={`readiness-badge ${status.className}`}>{status.label} · {readiness}%</span>
      </PageHeader>

      <section className="dash-card analytics-couple-summary">
        <div className="analytics-couple-summary__head">
          <div>
            <h2>Your wedding at a glance</h2>
            <p>Signed in as <strong>{user?.email || '—'}</strong> · Logged couple summary from your WowWed account</p>
          </div>
          <Link to="/wedding-profile" className="dash-btn dash-btn--outline">Edit profile</Link>
        </div>
        <div className="analytics-couple-summary__hero">
          <span className="analytics-couple-summary__avatar" aria-hidden="true">
            {(profile?.partnerOne?.[0] || '') + (profile?.partnerTwo?.[0] || user?.fullName?.[0] || 'W')}
          </span>
          <div>
            <strong className="analytics-couple-summary__name">{coupleName}</strong>
            <span className={`readiness-badge ${status.className}`}>{status.label} · {readiness}% ready</span>
          </div>
        </div>
        <ul className="analytics-couple-summary__grid">
          {summaryItems.map((item) => (
            <li key={item.label}>
              <span className="analytics-couple-summary__icon"><AppIcon name={item.icon} size={16} /></span>
              <div>
                <small>{item.label}</small>
                <strong>{item.value}</strong>
                {item.extra && <em>{item.extra}</em>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="analytics-grid">
        <section className="dash-card">
          <h2>RSVP breakdown</h2>
          <div className="bar-chart">
            <div className="bar-chart__row"><span>Accepted</span><div className="bar-chart__track"><div className="bar-chart__fill is-green" style={{ width: `${(accepted / rsvpTotal) * 100}%` }} /></div><em>{accepted}</em></div>
            <div className="bar-chart__row"><span>Pending</span><div className="bar-chart__track"><div className="bar-chart__fill is-yellow" style={{ width: `${(pending / rsvpTotal) * 100}%` }} /></div><em>{pending}</em></div>
            <div className="bar-chart__row"><span>Rejected</span><div className="bar-chart__track"><div className="bar-chart__fill is-red" style={{ width: `${(rejected / rsvpTotal) * 100}%` }} /></div><em>{rejected}</em></div>
          </div>
          <p className="analytics-footnote">RSVP progress counts for {guestPct}% of your readiness score.</p>
        </section>

        <section className="dash-card">
          <h2>Task completion</h2>
          <div className="analytics-big">{taskPct}%</div>
          <p>{done} of {tasks.length} tasks done</p>
          <div className="bar-chart__track" style={{ marginTop: '1rem' }}><div className="bar-chart__fill" style={{ width: `${taskPct}%` }} /></div>
        </section>

        <section className="dash-card">
          <h2>Budget utilisation</h2>
          <div className="analytics-big">{money(spent)}</div>
          <p>of {money(profileBudget)} ({budgetPct}%)</p>
          <div className="bar-chart__track" style={{ marginTop: '1rem' }}><div className="bar-chart__fill is-gold" style={{ width: `${Math.min(budgetPct, 100)}%` }} /></div>
        </section>

        <section className="dash-card">
          <h2>Smart seating quality</h2>
          {seatingQuality ? (
            <>
              <div className="analytics-big">{seatingQuality.seatingAccuracy ? `${seatingQuality.seatingAccuracy}%` : (seatingQuality.silhouette ?? '—')}</div>
              <p>Seating accuracy · k = {seatingQuality.k ?? '—'}</p>
              <p>Table-type accuracy: {seatingQuality.labelAccuracy ?? '—'}{seatingQuality.labelAccuracy != null ? '%' : ''}</p>
              <p>Silhouette: {seatingQuality.silhouette ?? '—'}</p>
              <p>Capacity violations: {seatingQuality.capacityViolations ?? 0} · rate {seatingQuality.violationRate ?? 0}</p>
              <p>{seatingQuality.assigned} of {seatingQuality.coming} Coming guests seated</p>
            </>
          ) : (
            <p>Run Auto-seat all on the Seating Chart to see seating accuracy.</p>
          )}
        </section>

        <section className="dash-card">
          <h2>Readiness score</h2>
          <p className="analytics-formula">Tasks 40% + RSVP 35% + Budget 25%</p>
          <div
            className={`readiness-meter ${status.className}`}
            style={{ '--ready': `${readiness}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={readiness}
            aria-label="Wedding readiness score"
          />
          <p>{coupleName}</p>
        </section>

        {categories.length > 0 && (
          <section className="dash-card analytics-wide">
            <h2>Spending by category</h2>
            <div className="bar-chart">
              {categories.map((cat) => {
                const catSpent = (budget.expenses || []).filter((e) => e.categoryId === cat.id).reduce((s, e) => s + Number(e.amount), 0);
                const pct = profileBudget ? (catSpent / profileBudget) * 100 : 0;
                return (
                  <div key={cat.id} className="bar-chart__row">
                    <span>{cat.name}</span>
                    <div className="bar-chart__track"><div className="bar-chart__fill" style={{ width: `${pct}%`, background: cat.color }} /></div>
                    <em>{money(catSpent)}</em>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPage;
