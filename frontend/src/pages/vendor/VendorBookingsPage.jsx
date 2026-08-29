import { useEffect, useMemo, useState } from 'react';
import { getBookings, getVendorProfile, refreshBookings, updateBookingStatus } from '../../utils/storage';
import {
  awaitingCouple,
  bookingDateKey,
  isPaid,
  vendorNeedsDecision,
} from '../../utils/bookingStatus';
import { downloadVendorBookingSummaryPdf } from '../../utils/vendorReports';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import BookingCalendar from '../../components/vendor/BookingCalendar';
import VendorRequestCard from '../../components/vendor/VendorRequestCard';
import ListPagination from '../../components/ui/ListPagination';
import { usePagination } from '../../hooks/usePagination';

const TABS = [
  { id: 'needs', label: 'Needs reply' },
  { id: 'waiting', label: 'Awaiting couple' },
  { id: 'hired', label: 'Paid' },
  { id: 'all', label: 'All' },
];

function inTab(booking, tab) {
  if (tab === 'needs') return vendorNeedsDecision(booking.status);
  if (tab === 'waiting') return awaitingCouple(booking.status) && !vendorNeedsDecision(booking.status);
  if (tab === 'hired') return isPaid(booking.status);
  return true;
}

function VendorBookingsPage() {
  const { user } = useAuth();
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
    needs: bookings.filter((b) => vendorNeedsDecision(b.status)).length,
    waiting: bookings.filter((b) => awaitingCouple(b.status) && !vendorNeedsDecision(b.status)).length,
    hired: bookings.filter((b) => isPaid(b.status)).length,
    all: bookings.length,
  }), [bookings]);

  const visible = bookings.filter((b) => {
    if (!inTab(b, tab)) return false;
    if (selectedDate && bookingDateKey(b) !== selectedDate) return false;
    return true;
  });

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
  } = usePagination(visible, { initialPageSize: 10, pageSizes: [10, 20, 50] });

  useEffect(() => {
    resetPage();
  }, [tab, selectedDate, resetPage]);

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

  const downloadSummary = () => {
    downloadVendorBookingSummaryPdf({
      profile: getVendorProfile(),
      bookings,
      user,
    });
  };

  return (
    <div className="dash-page vendor-bookings-page">
      <PageHeader
        moduleId="vendor-bookings"
        title="Booking requests"
        tagline="New couple requests appear here first. Use the calendar below for confirmed dates."
      >
        <button
          type="button"
          className="dash-btn dash-btn--primary"
          onClick={downloadSummary}
          disabled={!bookings.length}
          title={bookings.length ? 'Download all bookings as PDF' : 'No bookings to export yet'}
        >
          Download booking summary
        </button>
      </PageHeader>

      {counts.needs > 0 && (
        <div className="dash-alert dash-alert--success vendor-request-alert">
          <p>{counts.needs} request{counts.needs === 1 ? '' : 's'} waiting for Accept, Reply, Reject, or Negotiate.</p>
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
                : 'Try another tab — couple replies and new requests show up automatically.'}
          </p>
          {bookings.length > 0 && (
            <button type="button" className="dash-btn dash-btn--primary" onClick={downloadSummary}>
              Download all bookings PDF
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="guest-table-toolbar">
            <span className="guest-page-info">Showing {pageStart}–{pageEnd} of {visible.length}</span>
            <button type="button" className="dash-btn dash-btn--ghost" onClick={downloadSummary}>
              Download PDF summary
            </button>
          </div>
          <div className="vendor-request-grid">
            {pagedBookings.map((booking) => (
              <VendorRequestCard
                key={booking.id}
                booking={booking}
                busyId={busyId}
                onRespond={respond}
              />
            ))}
          </div>
          <ListPagination
            page={page}
            totalPages={totalPages}
            pageStart={pageStart}
            pageEnd={pageEnd}
            totalItems={visible.length}
            pageSize={pageSize}
            pageSizes={[10, 20, 50]}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            icon="vendors"
            showSummary={false}
          />
        </>
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
