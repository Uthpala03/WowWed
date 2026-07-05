import { Link } from 'react-router-dom';
import { getBookings, getVendorProfile } from '../../utils/storage';
import PageHeader from '../../components/ui/PageHeader';

function VendorDashboard() {
  const profile = getVendorProfile();
  const bookings = getBookings().filter((b) => b.vendorEmail === profile?.ownerEmail || b.vendorName === profile?.businessName);
  const confirmed = bookings.filter((b) => b.status === 'Confirmed').length;
  const pending = bookings.filter((b) => b.status === 'Pending').length;
  const earnings = bookings.filter((b) => b.status === 'Confirmed').reduce((s, b) => s + Number(b.amount || 0), 0);

  return (
    <div className="dash-page">
      <PageHeader
        moduleId="vendor-overview"
        title="Vendor Dashboard"
        tagline={profile?.businessName ? `${profile.businessName} — your listing is live on WowWed` : 'Complete your listing to go live instantly — no approval wait'}
      >
        {!profile && <Link to="/vendor/profile" className="dash-btn dash-btn--primary">Create listing</Link>}
      </PageHeader>
      <div className="dash-stats">
        <article className="dash-stat-card"><span>Pending requests</span><strong>{pending}</strong></article>
        <article className="dash-stat-card"><span>Confirmed</span><strong>{confirmed}</strong></article>
        <article className="dash-stat-card"><span>Earnings</span><strong>Rs. {earnings.toLocaleString()}</strong></article>
      </div>
      <div className="dash-card">
        <h2>Recent booking requests</h2>
        {bookings.length === 0 ? <p className="dash-empty">No booking requests yet.</p> : (
          <table className="guest-table">
            <thead><tr><th>Couple</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}><td>{b.coupleName}</td><td>{b.date}</td><td>Rs. {Number(b.amount).toLocaleString()}</td><td>{b.status}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default VendorDashboard;
