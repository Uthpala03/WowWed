import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { addReview, getBookings, loadReviews, refreshBookings, updateBookingStatus } from '../../utils/storage';
import { coupleCanHire, displayStatus, isPaid, needsVendorReply, statusTone } from '../../utils/bookingStatus';
import PageHeader from '../../components/ui/PageHeader';
import PrettySelect from '../../components/ui/PrettySelect';
import CoupleRequestCard from '../../components/vendor/CoupleRequestCard';

function CoupleBookingsPage() {
  const coupleData = useOutletContext();
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ bookingId: '', rating: 5, comment: '' });
  const [bookings, setBookings] = useState(() => coupleData?.bookings || getBookings() || []);

  useEffect(() => {
    setBookings(coupleData?.bookings || getBookings() || []);
  }, [coupleData]);

  useEffect(() => {
    let alive = true;
    refreshBookings()
      .then((rows) => { if (alive) setBookings(rows || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    loadReviews().then(setReviews).catch(() => setReviews([]));
  }, [bookings.length]);

  const reviewedIds = useMemo(() => new Set(reviews.map((item) => item.bookingId)), [reviews]);

  const grouped = useMemo(() => ({
    action: bookings.filter((b) => coupleCanHire(b.status)),
    pending: bookings.filter((b) => needsVendorReply(b.status)),
    hired: bookings.filter((b) => isPaid(b.status)),
    other: bookings.filter((b) => !coupleCanHire(b.status) && !needsVendorReply(b.status) && !isPaid(b.status)),
  }), [bookings]);

  const respond = async (id, status, extra = {}) => {
    setError('');
    setNotice('');
    setBusyId(id);
    try {
      await updateBookingStatus(id, status, extra);
      const next = await refreshBookings().catch(() => getBookings());
      setBookings(next || []);
      if (status === 'Paid') setNotice('Booking confirmed and added to your budget.');
      else if (status === 'Confirmed') setNotice('You accepted this offer. Confirm the booking when you are ready.');
      else if (status === 'Countered') setNotice('Your reply was sent to the vendor.');
      else if (status === 'Cancelled') setNotice('This booking was cancelled.');
    } catch (err) {
      setError(err.message || 'Could not update this request.');
    } finally {
      setBusyId('');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setError('');
    setBusyId(reviewForm.bookingId);
    try {
      const saved = await addReview(reviewForm);
      setReviews((prev) => [...prev, saved]);
      setReviewForm({ bookingId: '', rating: 5, comment: '' });
    } catch (err) {
      setError(err.message || 'Could not save this review.');
    } finally {
      setBusyId('');
    }
  };

  const renderCard = (booking) => (
    <div key={booking.id}>
      <CoupleRequestCard booking={booking} busyId={busyId} onRespond={respond} />
      {isPaid(booking.status) && !reviewedIds.has(booking.id) && (
        reviewForm.bookingId === booking.id ? (
          <form className="review-form" onSubmit={submitReview}>
            <div className="dash-field">
              <PrettySelect
                label="Star rating"
                icon="sparkle"
                value={reviewForm.rating}
                options={[5, 4, 3, 2, 1].map((n) => ({ value: n, label: `${n} star${n === 1 ? '' : 's'}`, icon: 'sparkle' }))}
                onChange={(rating) => setReviewForm({ ...reviewForm, rating: Number(rating) })}
              />
            </div>
            <label className="dash-field">
              <span>Review</span>
              <textarea rows={3} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="How was this vendor?" />
            </label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setReviewForm({ bookingId: '', rating: 5, comment: '' })}>Close</button>
              <button type="submit" className="dash-btn dash-btn--primary" disabled={busyId === booking.id}>Submit review</button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="dash-btn dash-btn--white"
            onClick={() => setReviewForm({ bookingId: booking.id, rating: 5, comment: '' })}
          >
            Leave a star rating
          </button>
        )
      )}
      {reviewedIds.has(booking.id) && (
        <p className="request-card__copy">You rated this vendor. Thank you.</p>
      )}
    </div>
  );

  return (
    <div className="dash-page">
      <PageHeader
        moduleId="bookings"
        title="Vendor requests"
        tagline="Confirm a booking, cancel, accept a counter-offer, or send a negotiation reply to the vendor."
      />
      {error && <div className="dash-alert dash-alert--danger"><p>{error}</p></div>}
      {notice && <div className="dash-alert dash-alert--success"><p>{notice}</p></div>}

      {bookings.length === 0 ? (
        <div className="dash-card dash-empty">
          <p>No vendor requests yet.</p>
          <Link to="/dashboard/vendors" className="dash-btn dash-btn--primary">Find vendors</Link>
        </div>
      ) : (
        <>
          <section className="dash-card">
            <h2>All chosen vendors</h2>
            <p className="request-card__copy">Every vendor you requested stays here while you add more.</p>
            <ul className="request-roster">
              {bookings.map((booking) => (
                <li key={`roster-${booking.id}`}>
                  <strong>{booking.vendorName}</strong>
                  <span>{booking.category || 'Vendor'}</span>
                  <span className={`rsvp-badge rsvp-badge--${statusTone(booking.status)}`}>{displayStatus(booking.status)}</span>
                </li>
              ))}
            </ul>
          </section>
          {grouped.action.length > 0 && (
            <section className="dash-card">
              <h2>Ready to hire</h2>
              {grouped.action.map(renderCard)}
            </section>
          )}
          {grouped.pending.length > 0 && (
            <section className="dash-card">
              <h2>Waiting for vendor</h2>
              {grouped.pending.map(renderCard)}
            </section>
          )}
          {grouped.hired.length > 0 && (
            <section className="dash-card">
              <h2>Already booked</h2>
              {grouped.hired.map(renderCard)}
            </section>
          )}
          {grouped.other.length > 0 && (
            <section className="dash-card">
              <h2>Other updates</h2>
              {grouped.other.map(renderCard)}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default CoupleBookingsPage;
