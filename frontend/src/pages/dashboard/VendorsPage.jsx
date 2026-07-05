import { useMemo, useState } from 'react';
import { vendorCategories } from '../../data/dashboardData';
import { addBooking, getUser, getWeddingProfile, getVendorListings } from '../../utils/storage';
import PageHeader from '../../components/ui/PageHeader';

function recommendVendors(vendors, profile) {
  if (!profile) return vendors;
  return [...vendors].sort((a, b) => {
    let scoreA = 0; let scoreB = 0;
    if (a.district === profile.district || a.city === profile.district) { scoreA += 3; scoreB += 3; }
    if (a.district === profile.district) scoreA += 1;
    if (b.district === profile.district) scoreB += 1;
    scoreA += (a.rating || 4) - (b.rating || 4);
    return scoreB - scoreA;
  });
}

function VendorsPage() {
  const profile = getWeddingProfile();
  const user = getUser();
  const [category, setCategory] = useState('All Categories');
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [bookingVendor, setBookingVendor] = useState(null);
  const [bookForm, setBookForm] = useState({ date: '', amount: '', message: '' });

  const allVendors = useMemo(() => getVendorListings(), []);

  const filtered = useMemo(() => {
    const list = allVendors.filter((v) => {
      const matchCat = category === 'All Categories' || v.category === category;
      const loc = v.city || v.district || '';
      const matchCity = !city || loc.toLowerCase().includes(city.toLowerCase());
      const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchCity && matchSearch;
    });
    return recommendVendors(list, profile);
  }, [allVendors, category, city, search, profile]);

  const submitBooking = async (e) => {
    e.preventDefault();
    await addBooking({
      id: `bk${Date.now()}`,
      vendorName: bookingVendor.name,
      vendorEmail: bookingVendor.ownerEmail || '',
      coupleName: profile ? `${profile.partnerOne} & ${profile.partnerTwo}` : user?.fullName,
      coupleEmail: user?.email,
      date: bookForm.date,
      amount: Number(bookForm.amount),
      message: bookForm.message,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    });
    setBookingVendor(null);
    setBookForm({ date: '', amount: '', message: '' });
  };

  return (
    <div className="dash-page vendors-page">
      <PageHeader moduleId="vendors" title="Find Your Perfect Wedding Vendors" className="vendors-hero" />
      <div className="vendor-search-bar vendor-search-bar--standalone">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {vendorCategories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input placeholder="Search by city" value={city} onChange={(e) => setCity(e.target.value)} />
        <input placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {profile && <p className="vendor-rec-note">✨ Recommended for {profile.district} · {profile.ceremonyType}</p>}

      <section className="vendors-section">
        <div className="vendor-grid">
          {filtered.map((vendor) => (
            <article key={vendor.id} className="vendor-card">
              <div className="vendor-card__image">
                {vendor.spotlight && <span className="vendor-spotlight">💍 Spotlight</span>}
              </div>
              <div className="vendor-card__body">
                <div className="vendor-avatar">{vendor.name[0]}</div>
                <div>
                  <strong>{vendor.name}</strong>
                  <small>{vendor.category}</small>
                  <small>{vendor.city || vendor.district} {vendor.rating ? `· ★ ${vendor.rating}` : ''}</small>
                </div>
              </div>
              <button type="button" className="dash-btn dash-btn--primary vendor-card__cta" onClick={() => setBookingVendor(vendor)}>Send booking request</button>
            </article>
          ))}
        </div>
      </section>

      {bookingVendor && (
        <div className="dash-overlay" onClick={() => setBookingVendor(null)}>
          <form className="dash-panel dash-panel--center" onSubmit={submitBooking} onClick={(e) => e.stopPropagation()}>
            <h2>Booking request</h2>
            <p className="dash-panel__title">{bookingVendor.name}</p>
            <label className="dash-field"><span>Event date</span><input type="date" required value={bookForm.date} onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })} /></label>
            <label className="dash-field"><span>Budget (LKR)</span><input type="number" required value={bookForm.amount} onChange={(e) => setBookForm({ ...bookForm, amount: e.target.value })} /></label>
            <label className="dash-field"><span>Message</span><textarea rows={3} value={bookForm.message} onChange={(e) => setBookForm({ ...bookForm, message: e.target.value })} /></label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setBookingVendor(null)}>Cancel</button>
              <button type="submit" className="dash-btn dash-btn--primary">Send request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default VendorsPage;
