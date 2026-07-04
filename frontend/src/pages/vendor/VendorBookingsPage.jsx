import { useState } from 'react';
import { getBookings, getUser, saveBookings } from '../../utils/storage';

function VendorBookingsPage() {
  const user = getUser();
  const [bookings, setBookings] = useState(() => getBookings().filter((b) => b.vendorEmail === user?.email));

  const respond = (id, status, counterAmount) => {
    const all = getBookings();
    const next = all.map((b) => {
      if (b.id !== id) return b;
      return { ...b, status, counterAmount: counterAmount || b.counterAmount, respondedAt: new Date().toISOString() };
    });
    saveBookings(next);
    setBookings(next.filter((b) => b.vendorEmail === user?.email));
  };

  return (
    <div className="dash-page">
      <header className="dash-page__header"><div><h1>Booking requests</h1><p>Accept, reject, or negotiate (M08)</p></div></header>
      <div className="dash-card">
        {bookings.length === 0 ? <p>No requests yet.</p> : bookings.map((b) => (
          <div key={b.id} className="booking-row">
            <div><strong>{b.coupleName}</strong><small>{b.date} · Rs. {Number(b.amount).toLocaleString()}</small><p>{b.message}</p></div>
            {b.status === 'Pending' ? (
              <div className="booking-actions">
                <button type="button" className="dash-btn dash-btn--primary" onClick={() => respond(b.id, 'Confirmed')}>Accept</button>
                <button type="button" className="dash-btn dash-btn--outline" onClick={() => respond(b.id, 'Rejected')}>Reject</button>
                <button type="button" className="dash-btn dash-btn--white" onClick={() => {
                  const amt = window.prompt('Counter offer (LKR):', b.amount);
                  if (amt) respond(b.id, 'Negotiating', Number(amt));
                }}>Negotiate</button>
              </div>
            ) : <span className="rsvp-badge">{b.status}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorBookingsPage;
