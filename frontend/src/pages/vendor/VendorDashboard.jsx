import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookings, getVendorProfile, loadReviews, refreshBookings, updateBookingStatus } from '../../utils/storage';
import { formatVendorCategories, formatVendorDistricts } from '../../utils/vendorMeta';
import { resolveUploadUrl } from '../../utils/uploadUrl';
import { awaitingCouple, displayStatus, isPaid, needsVendorReply, statusTone } from '../../utils/bookingStatus';
import { useAuth } from '../../context/AuthContext';
import VendorRequestCard from '../../components/vendor/VendorRequestCard';

function initials(name) {
  return String(name || 'C')
    .split(/[&\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function VendorDashboard() {
  const { user } = useAuth();
  const profile = getVendorProfile();
  const [bookings, setBookings] = useState(() => getBookings());
  const [reviews, setReviews] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const reload = async () => {
    const next = await refreshBookings().catch(() => getBookings());
    setBookings(next || []);
  };

  useEffect(() => {
    reload();
    loadReviews().then(setReviews).catch(() => setReviews([]));
    const onDataChanged = () => setBookings(getBookings() || []);
    window.addEventListener('wowwed-data-changed', onDataChanged);
    const timer = setInterval(reload, 8000);
    return () => {
      window.removeEventListener('wowwed-data-changed', onDataChanged);
      clearInterval(timer);
    };
  }, []);

  const hired = bookings.filter((b) => isPaid(b.status));
  const pending = bookings.filter((b) => needsVendorReply(b.status));
  const waiting = bookings.filter((b) => awaitingCouple(b.status));
  const earnings = hired.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const upcoming = [...bookings]
    .filter((b) => (isPaid(b.status) || awaitingCouple(b.status)) && b.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(0, 4);
  const cover = profile?.portfolioImages?.[0];
  const businessName = profile?.businessName || profile?.name || 'Your listing';
  const nextAction = pending[0] || waiting[0] || hired[0] || null;
  const avgReview = reviews.length
    ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1)
    : profile?.rating;
  const actionList = pending.length ? pending : bookings.slice(0, 5);

  const listingReady = useMemo(() => {
    const checks = [
      { ok: Boolean(businessName && businessName !== 'Your listing'), label: 'Business name' },
      { ok: Boolean(profile?.description), label: 'Description' },
      { ok: (profile?.portfolioImages || []).length > 0, label: 'Photos' },
      { ok: (profile?.quotations || []).length > 0, label: 'Packages' },
    ];
    const done = checks.filter((item) => item.ok).length;
    return { checks, done, pct: Math.round((done / checks.length) * 100) };
  }, [profile, businessName]);

  const respond = async (id, status, extra = {}) => {
    setError('');
    setBusyId(id);
    try {
      await updateBookingStatus(id, status, extra);
      await reload();
    } catch (err) {
      setError(err.message || 'Could not update this request.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="dash-page vendor-home">
      <section className={`vendor-hero${cover ? ' vendor-hero--photo' : ''}`}>
        {cover && <img src={resolveUploadUrl(cover)} alt="" className="vendor-hero__bg" />}
        <div className="vendor-hero__veil" />
        <div className="vendor-hero__inner">
          <div>
            <p className="vendor-hero__tag">Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</p>
            <h1>{businessName}</h1>
            <p className="vendor-hero__sub">
              {formatVendorCategories(profile)} · {formatVendorDistricts(profile)}
              {avgReview ? ` · ★ ${avgReview}` : ''}
              <span className="vendor-live-pill">Live</span>
              {pending.length > 0 && <span className="vendor-alert-pill">{pending.length} to reply</span>}
            </p>
          </div>
          <div className="vendor-hero__actions">
            <Link to="/vendor/bookings" className="dash-btn dash-btn--primary">
              {pending.length ? `Reply to ${pending.length}` : 'Bookings'}
            </Link>
            <Link to="/vendor/profile" className="dash-btn dash-btn--white">Edit listing</Link>
          </div>
        </div>
      </section>

      <div className="dash-stats vendor-home-stats">
        <article className={`dash-stat-card${pending.length ? ' dash-stat-card--pending' : ''}`}>
          <div className="dash-stat-card__top"><span>Needs reply</span></div>
          <strong>{pending.length}</strong>
        </article>
        <article className="dash-stat-card">
          <div className="dash-stat-card__top"><span>Awaiting couple</span></div>
          <strong>{waiting.length}</strong>
        </article>
        <article className="dash-stat-card">
          <div className="dash-stat-card__top"><span>Paid</span></div>
          <strong>{hired.length}</strong>
        </article>
        <article className="dash-stat-card dash-stat-card--highlight">
          <div className="dash-stat-card__top"><span>Earnings</span></div>
          <strong>Rs. {earnings.toLocaleString()}</strong>
        </article>
      </div>

      <div className="vendor-home-grid">
        <section className={`dash-card vendor-inbox${pending.length ? ' vendor-inbox--alert' : ''}`}>
          <div className="vendor-inbox__head">
            <div>
              <h2>{pending.length ? `New requests (${pending.length})` : 'Incoming requests'}</h2>
              <p>{pending.length ? 'Accept, decline, or send a counter-offer.' : 'Couple requests land here first.'}</p>
            </div>
            <Link to="/vendor/bookings" className="dash-btn dash-btn--ghost">Calendar</Link>
          </div>

          {error && <div className="dash-alert dash-alert--danger"><p>{error}</p></div>}

          {actionList.length === 0 ? (
            <div className="vendor-empty vendor-empty--inline">
              <span className="vendor-empty__mark">💌</span>
              <div>
                <strong>No requests yet</strong>
                <p>When a couple books you, the request appears here with Accept, Decline, and Negotiate.</p>
              </div>
            </div>
          ) : pending.length > 0 ? (
            <div className="vendor-request-grid vendor-request-grid--home">
              {actionList.map((booking) => (
                <VendorRequestCard
                  key={booking.id}
                  booking={booking}
                  busyId={busyId}
                  onRespond={respond}
                />
              ))}
            </div>
          ) : (
            <ul className="vendor-inbox__list">
              {actionList.map((b) => (
                <li key={b.id} className="vendor-inbox__item">
                  <span className="vendor-inbox__avatar">{initials(b.coupleName)}</span>
                  <div className="vendor-inbox__copy">
                    <strong>{b.coupleName || 'Couple'}</strong>
                    <small>{b.date || 'Date TBC'} · Rs. {Number(b.amount || 0).toLocaleString()}</small>
                  </div>
                  <span className={`rsvp-badge rsvp-badge--${statusTone(b.status)}`}>{displayStatus(b.status)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="vendor-side">
          <section className="dash-card">
            <h2>Next step</h2>
            {nextAction ? (
              <p className="vendor-side__copy">
                {needsVendorReply(nextAction.status)
                  ? `Reply to ${nextAction.coupleName || 'the couple'} (${nextAction.date || 'date TBC'}).`
                  : isPaid(nextAction.status)
                    ? `${nextAction.coupleName || 'A couple'} hired you for Rs. ${Number(nextAction.amount || 0).toLocaleString()}.`
                    : `Waiting for ${nextAction.coupleName || 'the couple'} to confirm hire.`}
              </p>
            ) : (
              <p className="vendor-side__muted">You’re all caught up.</p>
            )}
          </section>

          {upcoming.length > 0 && (
            <section className="dash-card">
              <h2>Upcoming</h2>
              <ul className="vendor-earn-list">
                {upcoming.map((item) => (
                  <li key={item.id}>
                    <strong>{item.date}</strong>
                    <span>{item.coupleName || 'Couple'}</span>
                    <em>{displayStatus(item.status)}</em>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hired.length > 0 && (
            <section className="dash-card">
              <h2>Earnings</h2>
              <ul className="vendor-earn-list">
                {hired.map((item) => (
                  <li key={item.id}>
                    <strong>Rs. {Number(item.amount || 0).toLocaleString()}</strong>
                    <span>{item.coupleName || 'Couple'} · {item.date || 'Date TBC'}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {reviews.length > 0 && (
            <section className="dash-card">
              <h2>Reviews</h2>
              <ul className="vendor-review-list">
                {reviews.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <strong>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</strong>
                    <span>{item.coupleName || 'Couple'}</span>
                    {item.comment ? <p>{item.comment}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="dash-card">
            <h2>Listing strength</h2>
            <p className="vendor-side__muted">{listingReady.pct}% complete</p>
            <div className="budget-bar vendor-strength-bar"><div style={{ width: `${listingReady.pct}%` }} /></div>
            <ul className="vendor-checks">
              {listingReady.checks.map((item) => (
                <li key={item.label} className={item.ok ? 'is-ok' : ''}>
                  <span>{item.ok ? '✓' : '○'}</span> {item.label}
                </li>
              ))}
            </ul>
            {listingReady.pct < 100 && (
              <Link to="/vendor/profile" className="dash-btn dash-btn--white">Improve listing</Link>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default VendorDashboard;
