import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  dashboardNav,
  defaultTasks,
  defaultGuests,
  getCategoryMeta,
  quickLinkHints,
} from '../../data/dashboardData';
import AppIcon from '../../components/ui/AppIcon';
import { getBudget, getGuests, getTasks, getUser, getWeddingProfile, initDashboardData } from '../../utils/storage';
import { getReadinessStatus } from '../../utils/notifications';

function daysUntil(dateString) {
  if (!dateString) return null;
  const diff = new Date(dateString) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function ProgressRing({ value, color, label }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="dash-ring" style={{ '--ring-color': color }}>
      <svg viewBox="0 0 88 88" aria-hidden="true">
        <circle className="dash-ring__bg" cx="44" cy="44" r={r} />
        <circle className="dash-ring__fg" cx="44" cy="44" r={r} strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <span className="dash-ring__value">{value}%</span>
      <span className="dash-ring__label">{label}</span>
    </div>
  );
}

function DashboardOverview() {
  const user = getUser();
  const profile = getWeddingProfile();
  const tasks = getTasks() || defaultTasks;
  const guests = getGuests();
  const budget = getBudget();
  const done = tasks.filter((t) => t.done).length;
  const accepted = guests.filter((g) => g.rsvp === 'Accepted').length;
  const spent = (budget?.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const taskPct = Math.round((done / Math.max(tasks.length, 1)) * 100);
  const guestPct = guests.length ? Math.round((accepted / guests.length) * 100) : 0;
  const budgetPct = budget?.total ? Math.round((spent / budget.total) * 100) : 0;
  const readiness = Math.round(taskPct * 0.4 + guestPct * 0.35 + budgetPct * 0.25);
  const readinessStatus = getReadinessStatus(readiness);
  const countdown = daysUntil(profile?.weddingDate);
  const upcoming = tasks.filter((t) => !t.done).slice(0, 4);
  const sixMonthPlan = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 0; i < 6; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const items = tasks.filter((t) => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        return due.getMonth() === d.getMonth() && due.getFullYear() === d.getFullYear();
      });
      months.push({ label, items });
    }
    return months;
  }, [tasks]);
  const tools = dashboardNav.filter((item) => !item.end);

  useEffect(() => {
    initDashboardData(defaultTasks, defaultGuests);
  }, []);

  const coupleName = profile
    ? `${profile.partnerOne} & ${profile.partnerTwo}`
    : user?.fullName || 'Your wedding';

  return (
    <div className="dash-home">
      <section className="dash-hero">
        <div className="dash-hero__blobs" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="dash-hero__inner">
          <div className="dash-hero__copy">
            <p className="dash-hero__tag">💍 Your love story, beautifully planned</p>
            <h1>{coupleName}</h1>
            <p className="dash-hero__sub">
              {profile?.weddingDate
                ? formatDate(profile.weddingDate)
                : 'Add your wedding date to start the countdown'}
              {profile?.ceremonyType && ` · ${profile.ceremonyType} ceremony`}
            </p>
            {!profile && (
              <Link to="/wedding-profile" className="dash-btn dash-btn--light">Complete your profile →</Link>
            )}
          </div>
          {countdown !== null && (
            <div className="dash-hero__countdown">
              <span className="dash-hero__countdown-num">{countdown}</span>
              <span className="dash-hero__countdown-text">days until<br />the big day</span>
            </div>
          )}
        </div>
      </section>

      <section className="dash-mood">
        <article className="dash-mood__card dash-mood__card--tasks">
          <ProgressRing value={taskPct} color="#6b9e78" label="Checklist" />
          <div>
            <strong>{done} of {tasks.length}</strong>
            <span>tasks completed</span>
          </div>
          <Link to="/dashboard/checklist">Open checklist</Link>
        </article>
        <article className="dash-mood__card dash-mood__card--guests">
          <ProgressRing value={guestPct} color="#e8a88c" label="Guests" />
          <div>
            <strong>{accepted} of {guests.length || 0}</strong>
            <span>guests confirmed</span>
          </div>
          <Link to="/dashboard/guests">Manage guests</Link>
        </article>
        <article className="dash-mood__card dash-mood__card--budget">
          <ProgressRing value={budgetPct} color="#d4a84b" label="Budget" />
          <div>
            <strong>{budgetPct}%</strong>
            <span>of budget used</span>
          </div>
          <Link to="/dashboard/budget">View budget</Link>
        </article>
        <article className="dash-mood__card dash-mood__card--love">
          <div className="dash-mood__heart">✨</div>
          <div>
            <strong>{readiness}%</strong>
            <span className={`readiness-badge ${readinessStatus.className}`}>{readinessStatus.label}</span>
            <span>wedding readiness</span>
          </div>
          <p>{readiness >= 60 ? 'You\'re doing wonderfully!' : 'One step at a time — you\'ve got this'}</p>
        </article>
      </section>

      <section className="dash-tools">
        <div className="dash-tools__head">
          <h2>Your planning tools</h2>
          <p>Everything you need, right at your fingertips</p>
        </div>
        <div className="dash-tools__grid">
          {tools.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="dash-tool"
              style={{ '--tool-bg': item.accent, '--tool-ring': item.ring }}
            >
              <span className="dash-tool__icon"><AppIcon name={item.icon} size={22} /></span>
              <span className="dash-tool__name">{item.label}</span>
              <span className="dash-tool__hint">{quickLinkHints[item.to]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="dash-timeline dash-timeline--months">
        <div className="dash-timeline__head">
          <h2>6-month planning timeline</h2>
          <Link to="/dashboard/checklist">Full checklist →</Link>
        </div>
        <div className="timeline-months">
          {sixMonthPlan.map((month) => (
            <article key={month.label} className="timeline-month">
              <h3>{month.label}</h3>
              {month.items.length === 0 ? (
                <p className="timeline-month__empty">No tasks scheduled</p>
              ) : (
                <ul>
                  {month.items.slice(0, 4).map((task) => (
                    <li key={task.id}>{task.title}</li>
                  ))}
                  {month.items.length > 4 && <li className="timeline-month__more">+{month.items.length - 4} more</li>}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="dash-timeline">
        <div className="dash-timeline__head">
          <h2>Coming up next</h2>
          <Link to="/dashboard/checklist">See full checklist →</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="dash-timeline__empty">🎉 All tasks done — enjoy the calm before the celebration!</p>
        ) : (
          <ul className="dash-timeline__list">
            {upcoming.map((task, i) => {
              const cat = getCategoryMeta(task.category);
              return (
                <li key={task.id} className="dash-timeline__item">
                  <span className="dash-timeline__dot">{i + 1}</span>
                  <div className="dash-timeline__body">
                    <strong>{task.title}</strong>
                    <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <span className="dash-timeline__tag" style={{ '--tag-color': cat.id === 'catering' ? '#d4a84b' : '#e8a88c' }}>
                    {cat.icon} {cat.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default DashboardOverview;
