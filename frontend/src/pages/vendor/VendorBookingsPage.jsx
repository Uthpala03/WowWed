import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getBookings, updateBookingStatus } from '../../utils/storage';
import PageHeader from '../../components/ui/PageHeader';

function VendorBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(() => getBookings().filter((b) => b.vendorEmail === user?.email));

  const respond = async (id, status) => {
    await updateBookingStatus(id, status);
    setBookings(getBookings().filter((b) => b.vendorEmail === user?.email));
  };

  return (
    <div className="dash-page">
      <PageHeader moduleId="vendor-bookings" title="Booking requests" />
      <div className="dash-card">
        {bookings.length === 0 ? <p>No requests yet.</p> : bookings.map((b) => (
          <div key={b.id} className="booking-row">
            <div><strong>{b.coupleName}</strong><small>{b.date} · Rs. {Number(b.amount).toLocaleString()}</small><p>{b.message}</p></div>
            {b.status === 'Pending' ? (
              <div className="booking-actions">
                <button type="button" className="dash-btn dash-btn--primary" onClick={() => respond(b.id, 'Confirmed')}>Accept</button>
                <button type="button" className="dash-btn dash-btn--outline" onClick={() => respond(b.id, 'Rejected')}>Reject</button>
                <button type="button" className="dash-btn dash-btn--white" onClick={() => respond(b.id, 'Negotiating')}>Negotiate</button>
              </div>
            ) : <span className="rsvp-badge">{b.status}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorBookingsPage;
