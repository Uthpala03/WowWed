import { useOutletContext } from 'react-router-dom';
import { getBudget, getGuests, getSeating, getTasks, getWeddingProfile } from '../../utils/storage';
import { getReadinessStatus } from '../../utils/notifications';
import PageHeader from '../../components/ui/PageHeader';

function AnalyticsPage() {
  const coupleData = useOutletContext();
  const profile = coupleData?.profile || getWeddingProfile();
  const tasks = coupleData?.tasks || getTasks() || [];
  const guests = coupleData?.guests || getGuests() || [];
  const budget = coupleData?.budget || getBudget();
  const seatingQuality = (coupleData?.seating || getSeating() || {}).mlQuality;
  const done = tasks.filter((t) => t.done).length;
  const accepted = guests.filter((g) => g.rsvp === 'Accepted').length;
  const rejected = guests.filter((g) => g.rsvp === 'Rejected').length;
  const pending = guests.filter((g) => g.rsvp === 'Pending').length;
  const spent = (budget?.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const taskPct = Math.round((done / Math.max(tasks.length, 1)) * 100);
  const guestPct = guests.length ? Math.round((accepted / guests.length) * 100) : 0;
  const budgetPct = budget?.total ? Math.round((spent / budget.total) * 100) : 0;
  const readiness = Math.round(taskPct * 0.4 + guestPct * 0.35 + budgetPct * 0.25);
  const status = getReadinessStatus(readiness);

  const rsvpTotal = Math.max(guests.length, 1);
  const categories = budget?.categories || [];

  return (
    <div className="dash-page">
      <PageHeader moduleId="analytics" title="Analytics Dashboard">
        <span className={`readiness-badge ${status.className}`}>{status.label} · {readiness}%</span>
      </PageHeader>

      <div className="analytics-grid">
        <section className="dash-card">
          <h2>RSVP breakdown</h2>
          <div className="bar-chart">
            <div className="bar-chart__row"><span>Accepted</span><div className="bar-chart__track"><div className="bar-chart__fill is-green" style={{ width: `${(accepted / rsvpTotal) * 100}%` }} /></div><em>{accepted}</em></div>
            <div className="bar-chart__row"><span>Pending</span><div className="bar-chart__track"><div className="bar-chart__fill is-yellow" style={{ width: `${(pending / rsvpTotal) * 100}%` }} /></div><em>{pending}</em></div>
            <div className="bar-chart__row"><span>Rejected</span><div className="bar-chart__track"><div className="bar-chart__fill is-red" style={{ width: `${(rejected / rsvpTotal) * 100}%` }} /></div><em>{rejected}</em></div>
          </div>
        </section>

        <section className="dash-card">
          <h2>Task completion</h2>
          <div className="analytics-big">{taskPct}%</div>
          <p>{done} of {tasks.length} tasks done</p>
          <div className="bar-chart__track" style={{ marginTop: '1rem' }}><div className="bar-chart__fill" style={{ width: `${taskPct}%` }} /></div>
        </section>

        <section className="dash-card">
          <h2>Budget utilisation</h2>
          <div className="analytics-big">Rs. {spent.toLocaleString()}</div>
          <p>of Rs. {budget?.total?.toLocaleString() || 0} ({budgetPct}%)</p>
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
          <div className={`readiness-meter ${status.className}`}>
            <div style={{ width: `${readiness}%` }} />
          </div>
          <p>{profile?.partnerOne} & {profile?.partnerTwo}</p>
        </section>

        {categories.length > 0 && (
          <section className="dash-card analytics-wide">
            <h2>Spending by category</h2>
            <div className="bar-chart">
              {categories.map((cat) => {
                const catSpent = (budget.expenses || []).filter((e) => e.categoryId === cat.id).reduce((s, e) => s + Number(e.amount), 0);
                const pct = budget.total ? (catSpent / budget.total) * 100 : 0;
                return (
                  <div key={cat.id} className="bar-chart__row">
                    <span>{cat.name}</span>
                    <div className="bar-chart__track"><div className="bar-chart__fill" style={{ width: `${pct}%`, background: cat.color }} /></div>
                    <em>Rs. {catSpent.toLocaleString()}</em>
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
