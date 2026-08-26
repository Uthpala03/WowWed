import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { addReview, getBookings, loadReviews, updateBookingStatus } from '../../utils/storage';
import { coupleCanHire, displayStatus, isPaid, needsVendorReply, statusTone } from '../../utils/bookingStatus';
import PageHeader from '../../components/ui/PageHeader';

const STATUS_COPY = {
  Pending: 'Waiting for the vendor to reply',
  Confirmed: 'Vendor accepted — confirm hire to add this to your budget',
  Accepted: 'Vendor accepted — confirm hire to add this to your budget',
  Negotiating: 'Vendor sent a counter-offer — review and confirm hire',
  Updated: 'Vendor sent a counter-offer — review and confirm hire',
  Rejected: 'Vendor declined this request',
  Paid: 'Paid — this amount is now in your budget. Leave a review after the event.',
  Hired: 'Paid — this amount is now in your budget. Leave a review after the event.',
  Cancelled: 'You cancelled this request',
};

function CoupleBookingsPage() {
  const coupleData = useOutletContext();
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ bookingId: '', rating: 5, comment: '' });
  const bookings = coupleData?.bookings || getBookings();

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

  const act = async (id, status) => {
    setError('');
    setBusyId(id);
    try {
      await updateBookingStatus(id, status);
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
    <article key={booking.id} className="request-card">
      <div className="request-card__top">
        <div>
          <strong>{booking.vendorName}</strong>
          <small>{booking.category || 'Wedding vendor'} · {booking.date || 'Date TBC'}</small>
        </div>
        <span className={`rsvp-badge rsvp-badge--${statusTone(booking.status)}`}>{displayStatus(booking.status)}</span>
      </div>
      <p className="request-card__amount">Rs. {Number(booking.amount || 0).toLocaleString()}</p>
      <p className="request-card__copy">{STATUS_COPY[booking.status] || booking.status}</p>
      {booking.message ? <p className="request-card__note">Your message: {booking.message}</p> : null}
      {booking.vendorNote ? <p className="request-card__note request-card__note--vendor">Vendor note: {booking.vendorNote}</p> : null}

      <div className="request-card__actions">
        {coupleCanHire(booking.status) && (
          <button
            type="button"
            className="dash-btn dash-btn--primary"
            disabled={busyId === booking.id}
            onClick={() => act(booking.id, 'Paid')}
          >
            {busyId === booking.id ? 'Confirming…' : 'Confirm hire — add to budget'}
          </button>
        )}
        {needsVendorReply(booking.status) && (
          <button
            type="button"
            className="dash-btn dash-btn--outline"
            disabled={busyId === booking.id}
            onClick={() => act(booking.id, 'Cancelled')}
          >
            Cancel request
          </button>
        )}
        {isPaid(booking.status) && (
          <Link to="/dashboard/budget" className="dash-btn dash-btn--white">View in budget</Link>
        )}
      </div>

      {isPaid(booking.status) && !reviewedIds.has(booking.id) && (
        reviewForm.bookingId === booking.id ? (
          <form className="review-form" onSubmit={submitReview}>
            <label className="dash-field">
              <span>Star rating</span>
              <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>)}
              </select>
            </label>
            <label className="dash-field">
              <span>Review</span>
              <textarea rows={3} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="How was this vendor?" />
            </label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setReviewForm({ bookingId: '', rating: 5, comment: '' })}>Cancel</button>
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
    </article>
  );

  return (
    <div className="dash-page">
      <PageHeader
        moduleId="bookings"
        title="Vendor requests"
        tagline="Vendors are notified when you send a request. After they accept or negotiate, confirm hire to update your budget."
      />
      {error && <div className="dash-alert dash-alert--danger"><p>{error}</p></div>}

      {bookings.length === 0 ? (
        <div className="dash-card dash-empty">
          <p>No vendor requests yet.</p>
          <Link to="/dashboard/vendors" className="dash-btn dash-btn--primary">Find vendors</Link>
        </div>
      ) : (
        <>
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
              <h2>Paid vendors</h2>
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
