import { Link, useOutletContext } from 'react-router-dom';
import {
  dashboardNav,
  getCategoryMeta,
  quickLinkHints,
} from '../../data/dashboardData';
import AppIcon from '../../components/ui/AppIcon';
import OnboardingIcon from '../../components/ui/OnboardingIcon';
import { getUser } from '../../utils/storage';
import { computeReadiness } from '../../utils/readiness';
import { onboardingCeremonyTypes } from '../../data/formOptions';

function daysUntil(dateString) {
  if (!dateString) return null;
  const diff = new Date(dateString) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function ceremonyChipIcon(value) {
  const raw = String(value || '').toLowerCase();
  const match = onboardingCeremonyTypes.find((type) => (
    type.id === value
    || type.label === value
    || raw.includes(type.id)
  ));
  if (match) return match.icon;
  if (raw.includes('hindu') || raw.includes('tamil')) return 'hindu';
  if (raw.includes('church') || raw.includes('christian')) return 'church';
  if (raw.includes('muslim') || raw.includes('nikah') || raw.includes('islam')) return 'nikah';
  if (raw.includes('reception') || raw.includes('civil')) return 'reception';
  return 'poruwa';
}

function DashboardOverview() {
  const coupleData = useOutletContext();
  const user = getUser();
  const profile = coupleData?.profile || null;
  const onboarding = coupleData?.onboarding || null;
  const tasks = coupleData?.tasks || [];
  const guests = coupleData?.guests || [];
  const budget = coupleData?.budget || null;
  const readinessInfo = computeReadiness({ tasks, guests, budget });
  const { score: readiness, taskPct, guestPct, budgetPct, done, accepted, status: readinessStatus } = readinessInfo;
  const weddingDate = String(profile?.weddingDate || onboarding?.weddingDate || '').slice(0, 10);
  const location = String(onboarding?.location || profile?.district || '').trim();
  const countdown = daysUntil(weddingDate);
  const upcoming = tasks.filter((t) => !t.done).slice(0, 6);
  const tools = dashboardNav.filter((item) => !item.end);
  const toolPulse = {
    '/dashboard/checklist': tasks.length ? `${done}/${tasks.length}` : null,
    '/dashboard/guests': guests.length ? `${accepted} RSVP` : null,
    '/dashboard/budget': budget?.total ? `${budgetPct}%` : null,
    '/dashboard/bookings': (coupleData?.bookings || []).length
      ? `${coupleData.bookings.length}`
      : null,
  };

  const coupleName = profile?.partnerOne && profile?.partnerTwo
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
            <p className="dash-hero__tag">{greetingForNow()} · your wedding home</p>
            <h1>{coupleName}</h1>
            <div className="dash-hero__chips">
              {weddingDate ? (
                <span>
                  <OnboardingIcon name="calendar" size={15} />
                  {formatDate(weddingDate)}
                </span>
              ) : (
                <Link to="/wedding-profile">
                  <OnboardingIcon name="calendar" size={15} />
                  Add your wedding date
                </Link>
              )}
              {location ? (
                <span>
                  <OnboardingIcon name="pin" size={15} />
                  {location}
                </span>
              ) : null}
              {profile?.ceremonyType ? (
                <span>
                  <OnboardingIcon name={ceremonyChipIcon(profile.ceremonyType)} size={15} />
                  {profile.ceremonyType}
                </span>
              ) : null}
            </div>
          </div>
          {countdown !== null && (
            <div className="dash-hero__countdown">
              <span className="dash-hero__countdown-num">{countdown}</span>
              <span className="dash-hero__countdown-text">days until<br />the big day</span>
            </div>
          )}
        </div>
      </section>

      <section className="dash-ready">
        <div className="dash-ready__top">
          <div>
            <p className="dash-ready__kicker">Wedding readiness score</p>
            <h2>How ready is your wedding?</h2>
          </div>
          <div className="dash-ready__score">
            <strong>{readiness}%</strong>
            <span className={`readiness-badge ${readinessStatus.className}`}>{readinessStatus.label}</span>
          </div>
        </div>
        <div
          className={`dash-ready__meter readiness-meter ${readinessStatus.className}`}
          style={{ '--ready': `${readiness}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={readiness}
          aria-label="Wedding readiness score"
        />
        <div className="dash-ready__parts">
          <span>Checklist {taskPct}%</span>
          <span>RSVPs {guestPct}%</span>
          <span>Budget {budgetPct}%</span>
        </div>
      </section>

      <section className="dash-glance">
        <Link to="/dashboard/checklist" className="dash-glance__stat dash-glance__stat--tasks">
          <span className="dash-glance__icon"><AppIcon name="checklist" size={18} /></span>
          <div>
            <strong>{done} of {tasks.length || 0}</strong>
            <span>tasks completed</span>
          </div>
        </Link>
        <Link to="/dashboard/guests" className="dash-glance__stat dash-glance__stat--guests">
          <span className="dash-glance__icon"><AppIcon name="guests" size={18} /></span>
          <div>
            <strong>{accepted} of {guests.length || 0}</strong>
            <span>guests confirmed</span>
          </div>
        </Link>
        <Link to="/dashboard/budget" className="dash-glance__stat dash-glance__stat--budget">
          <span className="dash-glance__icon"><AppIcon name="budget" size={18} /></span>
          <div>
            <strong>{budgetPct}%</strong>
            <span>of budget used</span>
          </div>
        </Link>
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
              {toolPulse[item.to] ? (
                <span className="dash-tool__pulse">{toolPulse[item.to]}</span>
              ) : null}
              <span className="dash-tool__name">{item.label}</span>
              <span className="dash-tool__hint">{quickLinkHints[item.to]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="dash-timeline">
        <div className="dash-timeline__head">
          <h2>Coming up next</h2>
          <Link to="/dashboard/checklist">See full checklist →</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="dash-timeline__empty">All tasks done — enjoy the calm before the celebration.</p>
        ) : (
          <ul className="dash-timeline__list dash-timeline__list--grid">
            {upcoming.map((task, i) => {
              const cat = getCategoryMeta(task.category);
              return (
                <li key={task.id} className="dash-timeline__item">
                  <span className="dash-timeline__dot">{i + 1}</span>
                  <div className="dash-timeline__body">
                    <strong>{task.title}</strong>
                    <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No due date'}</span>
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
