import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { addReview, getBookings, loadReviews, refreshBookings, updateBookingStatus } from '../../utils/storage';
import { coupleCanHire, isPaid, needsVendorReply } from '../../utils/bookingStatus';
import PageHeader from '../../components/ui/PageHeader';
import PrettySelect from '../../components/ui/PrettySelect';
import CoupleRequestCard from '../../components/vendor/CoupleRequestCard';
import ListPagination from '../../components/ui/ListPagination';
import { COMPACT_PAGE_SIZES, usePagination } from '../../hooks/usePagination';

function pickDefaultTab(grouped) {
  if (grouped.action.length) return 'action';
  if (grouped.pending.length) return 'pending';
  if (grouped.hired.length) return 'hired';
  if (grouped.other.length) return 'other';
  return 'all';
}

const TAB_DEFS = [
  { id: 'action', label: 'Need action', key: 'action' },
  { id: 'pending', label: 'Waiting', key: 'pending' },
  { id: 'hired', label: 'Booked', key: 'hired' },
  { id: 'other', label: 'Other', key: 'other' },
  { id: 'all', label: 'All', key: 'all' },
];

function CoupleBookingsPage() {
  const coupleData = useOutletContext();
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ bookingId: '', rating: 5, comment: '' });
  const [bookings, setBookings] = useState(() => coupleData?.bookings || getBookings() || []);
  const [tab, setTab] = useState('action');
  const [tabReady, setTabReady] = useState(false);

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

  useEffect(() => {
    if (!tabReady && bookings.length) {
      setTab(pickDefaultTab(grouped));
      setTabReady(true);
    }
  }, [bookings.length, grouped, tabReady]);

  const activeList = useMemo(() => {
    if (tab === 'all') return bookings;
    return grouped[tab] || [];
  }, [tab, grouped, bookings]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    pageItems: pagedBookings,
    pageStart,
    pageEnd,
    resetPage,
  } = usePagination(activeList, { initialPageSize: 10, pageSizes: [10, ...COMPACT_PAGE_SIZES] });

  useEffect(() => {
    resetPage();
  }, [tab, resetPage]);

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
      <CoupleRequestCard booking={booking} busyId={busyId} onRespond={respond} compact />
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
      <PageHeader moduleId="bookings" title="Vendor requests" />
      {error && <div className="dash-alert dash-alert--danger"><p>{error}</p></div>}
      {notice && <div className="dash-alert dash-alert--success"><p>{notice}</p></div>}

      {bookings.length === 0 ? (
        <div className="dash-card dash-empty">
          <p>No vendor requests yet.</p>
          <Link to="/dashboard/vendors" className="dash-btn dash-btn--primary">Find vendors</Link>
        </div>
      ) : (
        <>
          <section className="dash-summary-bar" aria-label="Request summary">
            <div className="dash-summary-bar__row">
              <span><strong>{bookings.length}</strong> total</span>
              {grouped.action.length > 0 && (
                <>
                  <span className="dash-summary-bar__sep">·</span>
                  <span><strong>{grouped.action.length}</strong> need your action</span>
                </>
              )}
              {grouped.pending.length > 0 && (
                <>
                  <span className="dash-summary-bar__sep">·</span>
                  <span><strong>{grouped.pending.length}</strong> waiting on vendor</span>
                </>
              )}
              {grouped.hired.length > 0 && (
                <>
                  <span className="dash-summary-bar__sep">·</span>
                  <span><strong>{grouped.hired.length}</strong> booked</span>
                </>
              )}
            </div>
          </section>

          <div className="dash-page-tabs" role="tablist" aria-label="Filter requests">
            {TAB_DEFS.map(({ id, label, key }) => {
              const count = key === 'all' ? bookings.length : grouped[key]?.length || 0;
              if (key !== 'all' && count === 0) return null;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className={`dash-page-tab${tab === id ? ' is-on' : ''}`}
                  onClick={() => setTab(id)}
                >
                  {label}<span>({count})</span>
                </button>
              );
            })}
          </div>

          <section className="dash-card">
            {activeList.length === 0 ? (
              <p className="request-card__copy">No requests in this tab.</p>
            ) : (
              <>
                {pagedBookings.map(renderCard)}
                {activeList.length > pageSize && (
                  <ListPagination
                    page={page}
                    totalPages={totalPages}
                    pageStart={pageStart}
                    pageEnd={pageEnd}
                    totalItems={activeList.length}
                    pageSize={pageSize}
                    pageSizes={[10, ...COMPACT_PAGE_SIZES]}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    icon="vendors"
                    showSummary={false}
                  />
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default CoupleBookingsPage;
