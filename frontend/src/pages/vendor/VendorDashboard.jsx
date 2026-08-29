import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookings, getVendorProfile, hydrateUserData, loadReviews, refreshBookings, updateBookingStatus } from '../../utils/storage';
import { formatVendorCategories, formatVendorDistricts } from '../../utils/vendorMeta';
import { computeListingStrength } from '../../utils/vendorReports';
import { resolveUploadUrl } from '../../utils/uploadUrl';
import { awaitingCouple, displayStatus, isPaid, vendorNeedsDecision } from '../../utils/bookingStatus';
import { useAuth } from '../../context/AuthContext';
import VendorRequestCard from '../../components/vendor/VendorRequestCard';

function VendorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(() => getVendorProfile());
  const [bookings, setBookings] = useState(() => getBookings());
  const [reviews, setReviews] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const reload = async () => {
    const next = await refreshBookings().catch(() => getBookings());
    setBookings(next || []);
    setProfile(getVendorProfile());
  };

  useEffect(() => {
    hydrateUserData()
      .then(() => {
        setProfile(getVendorProfile());
        setBookings(getBookings() || []);
      })
      .catch(() => {});
    reload();
    loadReviews().then(setReviews).catch(() => setReviews([]));
    const onDataChanged = () => {
      setBookings(getBookings() || []);
      setProfile(getVendorProfile());
    };
    window.addEventListener('wowwed-data-changed', onDataChanged);
    const timer = setInterval(reload, 8000);
    return () => {
      window.removeEventListener('wowwed-data-changed', onDataChanged);
      clearInterval(timer);
    };
  }, []);

  const hired = bookings.filter((b) => isPaid(b.status));
  const pending = bookings.filter((b) => vendorNeedsDecision(b.status));
  const waiting = bookings.filter((b) => awaitingCouple(b.status) && !vendorNeedsDecision(b.status));
  const earnings = hired.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const upcoming = [...bookings]
    .filter((b) => (isPaid(b.status) || awaitingCouple(b.status) || vendorNeedsDecision(b.status)) && b.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(0, 4);
  const cover = profile?.portfolioImages?.[0];
  const businessName = profile?.businessName || profile?.name || 'Your listing';
  const nextAction = pending[0] || waiting[0] || hired[0] || null;
  const avgReview = reviews.length
    ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1)
    : profile?.rating;
  const actionList = pending.length ? pending : bookings.slice(0, 5);

  const listingReady = useMemo(() => computeListingStrength({
    ...profile,
    ownerEmail: profile?.ownerEmail || user?.email,
  }), [profile, user?.email]);

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
              <h2>{pending.length ? `Incoming requests (${pending.length})` : 'Incoming requests'}</h2>
              <p>{pending.length ? 'Accept, reply, reject, or negotiate.' : 'Couple requests land here first.'}</p>
            </div>
            <Link to="/vendor/bookings" className="dash-btn dash-btn--ghost">Calendar</Link>
          </div>

          {error && <div className="dash-alert dash-alert--danger"><p>{error}</p></div>}

          {actionList.length === 0 ? (
            <div className="vendor-empty vendor-empty--inline">
              <span className="vendor-empty__mark">💌</span>
              <div>
                <strong>No requests yet</strong>
                <p>When a couple books you, the request appears here with Accept, Reply, Reject, and Negotiate.</p>
              </div>
            </div>
          ) : (
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
          )}
        </section>

        <aside className="vendor-side">
          <section className="dash-card">
            <h2>Next step</h2>
            {nextAction ? (
              <p className="vendor-side__copy">
                {vendorNeedsDecision(nextAction.status)
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
            <p className="vendor-side__muted">
              {listingReady.pct}% complete · {listingReady.done}/{listingReady.total} from your listing
            </p>
            <div
              className="budget-bar vendor-strength-bar"
              style={{ '--spent': `${listingReady.pct}%` }}
              role="progressbar"
              aria-valuenow={listingReady.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Listing strength"
            />
            <ul className="vendor-checks">
              {listingReady.checks.map((item) => (
                <li key={item.label} className={item.ok ? 'is-ok' : ''}>
                  <span>{item.ok ? '✓' : '○'}</span>
                  <div>
                    <strong>{item.label}</strong>
                    {!item.ok && <em className="vendor-check-hint">{item.hint}</em>}
                  </div>
                </li>
              ))}
            </ul>
            <p className="vendor-side__muted vendor-strength-meta">
              {listingReady.summary.photoCount} photo{listingReady.summary.photoCount === 1 ? '' : 's'}
              {' · '}
              {listingReady.summary.packageCount} package{listingReady.summary.packageCount === 1 ? '' : 's'}
            </p>
            <Link to="/vendor/profile" className="dash-btn dash-btn--white">
              {listingReady.pct < 100 ? 'Complete listing' : 'Edit listing'}
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default VendorDashboard;
