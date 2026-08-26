import { useEffect, useMemo, useState } from 'react';
import { vendorCategories } from '../../data/dashboardData';
import { addBooking, getUser, getWeddingProfile, getVendorListings, refreshVendorListings } from '../../utils/storage';
import { quoteHasPdf, resolveUploadUrl } from '../../utils/uploadUrl';
import {
  formatVendorCategories,
  formatVendorDistricts,
  locationSearchText,
  vendorLocations,
  vendorMatchesCategory,
  vendorMatchesDistrict,
  vendorMatchesLocation,
} from '../../utils/vendorMeta';
import PageHeader from '../../components/ui/PageHeader';
import VendorDetailModal from '../../components/vendor/VendorDetailModal';

function formatQuotePrice(price) {
  const n = Number(String(price || '').replace(/,/g, ''));
  return n ? `Rs. ${n.toLocaleString()}` : '—';
}

function recommendVendors(vendors, profile) {
  if (!profile) return vendors;
  return [...vendors].sort((a, b) => {
    let scoreA = 0; let scoreB = 0;
    if (vendorMatchesLocation(a, profile.district)) scoreA += 4;
    if (vendorMatchesLocation(b, profile.district)) scoreB += 4;
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
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [bookingVendor, setBookingVendor] = useState(null);
  const [bookForm, setBookForm] = useState({ date: '', amount: '', message: '' });
  const [listVersion, setListVersion] = useState(0);

  useEffect(() => {
    refreshVendorListings().then(() => setListVersion((v) => v + 1));
  }, []);

  const allVendors = useMemo(() => getVendorListings(), [listVersion]);

  const filtered = useMemo(() => {
    const list = allVendors.filter((v) => {
      const matchCat = vendorMatchesCategory(v, category);
      const matchCity = vendorMatchesDistrict(v, city);
      const matchSearch = !search || (
        v.name.toLowerCase().includes(search.toLowerCase())
        || locationSearchText(v).includes(search.toLowerCase())
        || (v.description || '').toLowerCase().includes(search.toLowerCase())
      );
      return matchCat && matchCity && matchSearch;
    });
    return recommendVendors(list, profile);
  }, [allVendors, category, city, search, profile]);

  const openBooking = (vendor) => {
    setSelectedVendor(null);
    setBookingVendor(vendor);
    const firstPrice = vendor.quotations?.[0]?.price;
    setBookForm({
      date: profile?.weddingDate || '',
      amount: firstPrice ? String(firstPrice) : '',
      message: '',
    });
  };

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
        <input placeholder="Search by city or branch" value={city} onChange={(e) => setCity(e.target.value)} />
        <input placeholder="Search vendors, places…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {profile && <p className="vendor-rec-note">✨ Recommended for {profile.district} · {profile.ceremonyType}</p>}

      <section className="vendors-section">
        <div className="vendor-grid">
          {filtered.map((vendor) => {
            const cover = vendor.portfolioImages?.[0];
            const photoCount = vendor.portfolioImages?.length || 0;
            const places = vendorLocations(vendor);
            return (
            <article
              key={vendor.id}
              className="vendor-card vendor-card--clickable vendor-card--gallery"
              onClick={() => setSelectedVendor(vendor)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedVendor(vendor)}
              role="button"
              tabIndex={0}
            >
              <div className="vendor-card__image">
                {cover ? (
                  <img
                    src={resolveUploadUrl(cover)}
                    alt=""
                    className="vendor-card__photo"
                  />
                ) : (
                  <span className="vendor-card__photo-fallback">{vendor.name[0]}</span>
                )}
                <div className="vendor-card__image-fade" />
                {vendor.spotlight && <span className="vendor-spotlight">💍 Spotlight</span>}
                {photoCount > 0 && (
                  <span className="vendor-card__photo-count">
                    {photoCount} photo{photoCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <div className="vendor-card__body">
                <div className="vendor-avatar">{vendor.name[0]}</div>
                <div>
                  <strong>{vendor.name}</strong>
                  <small>{formatVendorCategories(vendor)}</small>
                  <small>{formatVendorDistricts(vendor)} {vendor.rating ? `· ★ ${vendor.rating}` : ''}</small>
                </div>
              </div>
              {places.length > 0 && (
                <div className="vendor-card__places">
                  {places.slice(0, 2).map((place) => (
                    <span key={`${place.name}-${place.city}`} className="vendor-place-chip">
                      {place.city || place.name}
                    </span>
                  ))}
                  {places.length > 2 && (
                    <span className="vendor-place-chip vendor-place-chip--more">+{places.length - 2} more</span>
                  )}
                </div>
              )}
              {(vendor.quotationPdf?.url
                || vendor.quotations?.some((q) => quoteHasPdf(q))
                || vendor.quotations?.length > 0) && (
                <p className="vendor-card__quote-hint">
                  {(vendor.quotationPdf?.url || vendor.quotations?.some((q) => quoteHasPdf(q))) && '📄 Quotation PDF · '}
                  {vendor.quotations.length > 0
                    ? `${vendor.quotations.length} package${vendor.quotations.length > 1 ? 's' : ''} from ${formatQuotePrice(vendor.quotations[0].price)}`
                    : 'Packages available'}
                </p>
              )}
              <button
                type="button"
                className="dash-btn dash-btn--primary vendor-card__cta"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVendor(vendor);
                }}
              >
                View details
              </button>
            </article>
            );
          })}
        </div>
      </section>

      {selectedVendor && (
        <VendorDetailModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onRequestBooking={openBooking}
        />
      )}

      {bookingVendor && (
        <div className="dash-overlay" onClick={() => setBookingVendor(null)}>
          <form className="dash-panel dash-panel--center vendor-booking-panel" onSubmit={submitBooking} onClick={(e) => e.stopPropagation()}>
            <h2>Send booking request</h2>
            <p className="dash-panel__title">{bookingVendor.name}</p>
            <p className="vendor-booking-panel__sub">{formatVendorCategories(bookingVendor)} · {formatVendorDistricts(bookingVendor)}</p>

            <label className="dash-field">
              <span>Event date</span>
              <input type="date" required value={bookForm.date} onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })} />
            </label>
            <label className="dash-field">
              <span>Budget (LKR)</span>
              <input type="number" required value={bookForm.amount} onChange={(e) => setBookForm({ ...bookForm, amount: e.target.value })} placeholder="Your budget for this vendor" />
            </label>
            <label className="dash-field">
              <span>Message to vendor</span>
              <textarea rows={3} value={bookForm.message} onChange={(e) => setBookForm({ ...bookForm, message: e.target.value })} placeholder="Tell them about your wedding plans…" />
            </label>
            <div className="dash-panel__actions">
              <button type="button" className="dash-btn dash-btn--ghost" onClick={() => { setBookingVendor(null); setSelectedVendor(bookingVendor); }}>← Back to details</button>
              <button type="submit" className="dash-btn dash-btn--primary">Send request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default VendorsPage;
