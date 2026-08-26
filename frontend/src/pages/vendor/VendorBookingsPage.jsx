import { useEffect, useMemo, useState } from 'react';
import { getBookings, refreshBookings, updateBookingStatus } from '../../utils/storage';
import {
  awaitingCouple,
  bookingDateKey,
  isPaid,
  needsVendorReply,
} from '../../utils/bookingStatus';
import PageHeader from '../../components/ui/PageHeader';
import BookingCalendar from '../../components/vendor/BookingCalendar';
import VendorRequestCard from '../../components/vendor/VendorRequestCard';

const TABS = [
  { id: 'needs', label: 'Needs reply' },
  { id: 'waiting', label: 'Awaiting couple' },
  { id: 'hired', label: 'Paid' },
  { id: 'all', label: 'All' },
];

function inTab(booking, tab) {
  if (tab === 'needs') return needsVendorReply(booking.status);
  if (tab === 'waiting') return awaitingCouple(booking.status);
  if (tab === 'hired') return isPaid(booking.status);
  return true;
}

function VendorBookingsPage() {
  const [bookings, setBookings] = useState(() => getBookings());
  const [tab, setTab] = useState('needs');
  const [selectedDate, setSelectedDate] = useState('');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const reload = async () => {
    const next = await refreshBookings().catch(() => getBookings());
    setBookings(next || []);
  };

  useEffect(() => {
    reload();
    const onDataChanged = () => setBookings(getBookings() || []);
    window.addEventListener('wowwed-data-changed', onDataChanged);
    const timer = setInterval(reload, 8000);
    return () => {
      window.removeEventListener('wowwed-data-changed', onDataChanged);
      clearInterval(timer);
    };
  }, []);

  const counts = useMemo(() => ({
    needs: bookings.filter((b) => needsVendorReply(b.status)).length,
    waiting: bookings.filter((b) => awaitingCouple(b.status)).length,
    hired: bookings.filter((b) => isPaid(b.status)).length,
    all: bookings.length,
  }), [bookings]);

  const visible = bookings.filter((b) => {
    if (!inTab(b, tab)) return false;
    if (selectedDate && bookingDateKey(b) !== selectedDate) return false;
    return true;
  });

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
    <div className="dash-page vendor-bookings-page">
      <PageHeader
        moduleId="vendor-bookings"
        title="Booking requests"
        tagline="New couple requests appear here first. Use the calendar below for confirmed dates."
      />

      {counts.needs > 0 && (
        <div className="dash-alert dash-alert--success vendor-request-alert">
          <p>{counts.needs} request{counts.needs === 1 ? '' : 's'} waiting for Accept, Decline, or Negotiate.</p>
        </div>
      )}

      <div className="vendor-tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`vendor-tab${tab === item.id ? ' is-on' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            <em>{counts[item.id]}</em>
          </button>
        ))}
      </div>

      {error && <div className="dash-alert dash-alert--danger"><p>{error}</p></div>}

      {visible.length === 0 ? (
        <div className="dash-card vendor-empty">
          <span className="vendor-empty__mark">{tab === 'needs' ? '✨' : '📋'}</span>
          <h3>{bookings.length === 0 ? 'No requests yet' : 'Nothing in this view'}</h3>
          <p>
            {bookings.length === 0
              ? 'When a couple chooses your listing, their request lands here so you can accept, reject, or negotiate.'
              : selectedDate
                ? 'No bookings on this date. Pick another day on the calendar, or clear the date filter.'
                : 'Try another tab — new couple replies will show up automatically.'}
          </p>
        </div>
      ) : (
        <div className="vendor-request-grid">
          {visible.map((booking) => (
            <VendorRequestCard
              key={booking.id}
              booking={booking}
              busyId={busyId}
              onRespond={respond}
            />
          ))}
        </div>
      )}

      <BookingCalendar
        compact
        bookings={bookings}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
    </div>
  );
}

export default VendorBookingsPage;
