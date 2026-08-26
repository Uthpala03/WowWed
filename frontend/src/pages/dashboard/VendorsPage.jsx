import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { vendorCategories } from '../../data/dashboardData';
import {
  addBooking,
  getAvailability,
  getBookings,
  getUser,
  getWeddingProfile,
  getVendorListings,
  refreshBookings,
  refreshVendorListings,
} from '../../utils/storage';
import {
  locationSearchText,
  formatPriceRange,
  formatVendorCategories,
  formatVendorDistricts,
  vendorMatchesCategory,
  vendorMatchesDistrict,
} from '../../utils/vendorMeta';
import { bookingForVendor, parseVendorPriceBounds, recommendSmartVendors } from '../../utils/smartVendorMatch';
import { displayStatus } from '../../utils/bookingStatus';
import PageHeader from '../../components/ui/PageHeader';
import VendorCard from '../../components/vendor/VendorCard';
import VendorDetailModal from '../../components/vendor/VendorDetailModal';

const PRICE_BANDS = [
  { id: 'any', label: 'Any price' },
  { id: 'under200', label: 'Under Rs. 200k', max: 200000 },
  { id: '200to500', label: 'Rs. 200k – 500k', min: 200000, max: 500000 },
  { id: '500to1m', label: 'Rs. 500k – 1M', min: 500000, max: 1000000 },
  { id: 'over1m', label: 'Rs. 1M+', min: 1000000 },
];

function vendorFitsPriceBand(vendor, band) {
  if (!band || band.id === 'any') return true;
  const { min, max } = parseVendorPriceBounds(vendor);
  const vMin = min || 0;
  const vMax = max || min || 0;
  if (!vMin && !vMax) return true;
  const bMin = band.min || 0;
  const bMax = band.max || Infinity;
  return vMin <= bMax && vMax >= bMin;
}

function VendorsPage() {
  const coupleData = useOutletContext();
  const profile = coupleData?.profile || getWeddingProfile();
  const user = getUser();
  const [category, setCategory] = useState('All Categories');
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [priceBandId, setPriceBandId] = useState('any');
  const [minRating, setMinRating] = useState(0);
  const [compareIds, setCompareIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [bookingVendor, setBookingVendor] = useState(null);
  const [bookForm, setBookForm] = useState({ date: '', amount: '', message: '', packageTitle: '' });
  const [availability, setAvailability] = useState(null);
  const [listVersion, setListVersion] = useState(0);
  const [sentNotice, setSentNotice] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    refreshVendorListings().then(() => setListVersion((v) => v + 1));
    refreshBookings().catch(() => {});
  }, []);

  const allVendors = useMemo(() => getVendorListings(), [listVersion]);
  const bookings = coupleData?.bookings || getBookings() || [];

  const requested = useMemo(() => {
    const active = bookings.filter((b) => !['Cancelled'].includes(b.status));
    return allVendors
      .map((vendor) => ({ vendor, booking: bookingForVendor(active, vendor) }))
      .filter((row) => row.booking);
  }, [allVendors, bookings]);

  const requestedIds = useMemo(() => requested.map((row) => row.vendor.id), [requested]);

  const smart = useMemo(
    () => recommendSmartVendors(allVendors, profile, { limit: 8, excludeIds: requestedIds }),
    [allVendors, profile, requestedIds],
  );

  const priceBand = PRICE_BANDS.find((item) => item.id === priceBandId) || PRICE_BANDS[0];
  const filtersActive = Boolean(search || city || category !== 'All Categories' || priceBandId !== 'any' || minRating);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const requestedSet = new Set(requestedIds);
    return allVendors.filter((v) => {
      if (requestedSet.has(v.id) && !filtersActive) return false;
      const matchCat = vendorMatchesCategory(v, category);
      const matchCity = vendorMatchesDistrict(v, city);
      const matchPrice = vendorFitsPriceBand(v, priceBand);
      const matchRating = !minRating || Number(v.rating || 0) >= minRating;
      const matchSearch = !q || (
        v.name.toLowerCase().includes(q)
        || locationSearchText(v).includes(q)
        || (v.description || '').toLowerCase().includes(q)
      );
      return matchCat && matchCity && matchPrice && matchRating && matchSearch;
    });
  }, [allVendors, category, city, search, requestedIds, priceBand, minRating, filtersActive]);

  const compareVendors = useMemo(
    () => compareIds.map((id) => allVendors.find((vendor) => vendor.id === id)).filter(Boolean),
    [compareIds, allVendors],
  );

  const toggleCompare = (vendor) => {
    setCompareIds((prev) => {
      if (prev.includes(vendor.id)) {
        const next = prev.filter((id) => id !== vendor.id);
        if (next.length < 2) setCompareOpen(false);
        return next;
      }
      if (prev.length >= 3) return prev;
      const next = [...prev, vendor.id];
      if (next.length >= 2) setCompareOpen(true);
      return next;
    });
  };

  useEffect(() => {
    if (!bookingVendor || !bookForm.date) {
      setAvailability(null);
      return undefined;
    }
    let alive = true;
    getAvailability(bookingVendor.id, bookForm.date)
      .then((result) => { if (alive) setAvailability(result); })
      .catch(() => { if (alive) setAvailability(null); });
    return () => { alive = false; };
  }, [bookingVendor, bookForm.date]);

  const openBooking = (vendor) => {
    const existing = bookingForVendor(bookings, vendor);
    if (existing && !['Rejected', 'Cancelled'].includes(existing.status)) {
      setSelectedVendor(vendor);
      return;
    }
    setSelectedVendor(null);
    setBookingVendor(vendor);
    const firstPrice = vendor.quotations?.[0]?.price;
    setBookForm({
      date: profile?.weddingDate || '',
      amount: firstPrice ? String(firstPrice) : '',
      message: '',
      packageTitle: vendor.quotations?.[0]?.title || '',
    });
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setSendError('');
    if (!bookingVendor?.id) {
      setSendError('This listing is missing an id. Refresh Find Vendors and send again.');
      return;
    }
    const existing = bookingForVendor(bookings, bookingVendor);
    if (existing && !['Rejected', 'Cancelled'].includes(existing.status)) {
      setSendError('You already sent a request to this vendor. Open Requests to track it.');
      return;
    }
    if (availability && availability.available === false) {
      setSendError('This vendor is already booked on that date. Please choose another date.');
      return;
    }
    setSending(true);
    try {
      await addBooking({
        id: `bk${Date.now()}`,
        vendorListingId: bookingVendor.id,
        vendorId: bookingVendor.id,
        vendorName: bookingVendor.name,
        vendorEmail: bookingVendor.ownerEmail || '',
        category: bookingVendor.category || bookingVendor.categories?.[0] || '',
        coupleName: profile ? `${profile.partnerOne} & ${profile.partnerTwo}` : user?.fullName,
        coupleEmail: user?.email,
        date: bookForm.date,
        amount: Number(bookForm.amount),
        message: [bookForm.packageTitle && `Package: ${bookForm.packageTitle}`, bookForm.message].filter(Boolean).join('\n'),
        status: 'Pending',
        createdAt: new Date().toISOString(),
      });
      setBookingVendor(null);
      setBookForm({ date: '', amount: '', message: '', packageTitle: '' });
      setSentNotice(`${bookingVendor.name} has been notified. Track the reply under Requests.`);
    } catch (err) {
      setSendError(err.message || 'Could not send this request.');
    } finally {
      setSending(false);
    }
  };

  const selectedBooking = bookingForVendor(bookings, selectedVendor);

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
      <div className="vendor-filter-row">
        <select value={priceBandId} onChange={(e) => setPriceBandId(e.target.value)} aria-label="Price range">
          {PRICE_BANDS.map((band) => <option key={band.id} value={band.id}>{band.label}</option>)}
        </select>
        <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} aria-label="Minimum rating">
          <option value={0}>Any rating</option>
          <option value={4}>★ 4.0 and up</option>
          <option value={4.5}>★ 4.5 and up</option>
          <option value={4.8}>★ 4.8 and up</option>
        </select>
        <p>{filtered.length} matching listing{filtered.length === 1 ? '' : 's'} · Add 2–3 to compare side by side</p>
      </div>

      {sentNotice && (
        <div className="dash-alert dash-alert--success vendor-request-alert">
          <p>{sentNotice}</p>
          <Link to="/dashboard/bookings" className="dash-btn dash-btn--white">Open requests</Link>
          <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setSentNotice('')}>Dismiss</button>
        </div>
      )}

      {requested.length > 0 && (
        <section className="vendor-board vendor-board--requested">
          <div className="vendor-board__head">
            <div>
              <p className="vendor-board__kicker">Your vendors</p>
              <h2>Already requested</h2>
              <p>You already sent a booking request to {requested.length} vendor{requested.length === 1 ? '' : 's'}.</p>
            </div>
            <Link to="/dashboard/bookings" className="dash-btn dash-btn--white">Manage requests</Link>
          </div>
          <div className="vendor-grid">
            {requested.map(({ vendor, booking }) => (
              <VendorCard
                key={`req-${vendor.id}`}
                vendor={vendor}
                booking={booking}
                ctaLabel="View request"
                onOpen={setSelectedVendor}
                comparing={compareIds.includes(vendor.id)}
                compareDisabled={compareIds.length >= 3}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>
        </section>
      )}

      <section className="vendor-board vendor-board--smart">
        <div className="vendor-board__head">
          <div>
            <p className="vendor-board__kicker">M09 Smart Vendor Recommendation</p>
            <h2>Matched to your wedding</h2>
            <p>
              Rule-based ranking using budget, district, and wedding type.
              {profile?.district ? ` ${profile.district}` : ''}
              {profile?.ceremonyType ? ` · ${profile.ceremonyType}` : ''}
              {smart.budget ? ` · Rs. ${Number(smart.budget).toLocaleString()}` : ''}
            </p>
          </div>
          <div className="vendor-smart-keys">
            <span className={`vendor-smart-key${profile?.district ? ' is-on' : ''}`}>District</span>
            <span className={`vendor-smart-key${smart.budget ? ' is-on' : ''}`}>Budget</span>
            <span className={`vendor-smart-key${profile?.ceremonyType ? ' is-on' : ''}`}>Wedding type</span>
          </div>
        </div>
        {smart.matches.length === 0 ? (
          <p className="vendor-board__empty">
            No vendors currently match all three of your district, budget, and wedding type.
            Browse the full list below, or update your wedding profile.
          </p>
        ) : (
          <div className="vendor-grid">
            {smart.matches.map((row, index) => (
              <VendorCard
                key={`smart-${row.vendor.id}`}
                vendor={row.vendor}
                rank={index + 1}
                booking={bookingForVendor(bookings, row.vendor)}
                matchChips={[
                  row.districtOk ? 'District' : null,
                  row.budgetOk ? 'Budget' : null,
                  row.weddingTypeOk ? 'Wedding type' : null,
                ].filter(Boolean)}
                onOpen={setSelectedVendor}
                comparing={compareIds.includes(row.vendor.id)}
                compareDisabled={compareIds.length >= 3}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>
        )}
      </section>

      <section className="vendors-section">
        <div className="vendor-board__head vendor-board__head--plain">
          <div>
            <h2>All vendors</h2>
            <p>{filtered.length} listing{filtered.length === 1 ? '' : 's'} in the catalogue</p>
          </div>
        </div>
        <div className="vendor-grid">
          {filtered.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              booking={bookingForVendor(bookings, vendor)}
              ctaLabel={bookingForVendor(bookings, vendor) ? 'View request' : 'View details'}
              onOpen={setSelectedVendor}
              comparing={compareIds.includes(vendor.id)}
              compareDisabled={compareIds.length >= 3}
              onToggleCompare={toggleCompare}
            />
          ))}
        </div>
      </section>

      {selectedVendor && (
        <VendorDetailModal
          vendor={selectedVendor}
          existingBooking={selectedBooking}
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
            {sendError && <p className="form__error">{sendError}</p>}

            {bookingVendor.quotations?.length > 0 && (
              <label className="dash-field">
                <span>Package</span>
                <select
                  value={bookForm.packageTitle}
                  onChange={(e) => {
                    const quote = bookingVendor.quotations.find((q) => q.title === e.target.value);
                    setBookForm({
                      ...bookForm,
                      packageTitle: e.target.value,
                      amount: quote?.price ? String(quote.price) : bookForm.amount,
                    });
                  }}
                >
                  {bookingVendor.quotations.map((q) => (
                    <option key={q.id || q.title} value={q.title}>{q.title} {q.price ? `· Rs. ${Number(String(q.price).replace(/,/g, '') || 0).toLocaleString()}` : ''}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="dash-field">
              <span>Event date</span>
              <input type="date" required value={bookForm.date} onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })} />
            </label>
            {availability && bookForm.date && (
              <p className={`vendor-avail ${availability.available ? 'is-ok' : 'is-busy'}`}>
                {availability.available
                  ? 'This date looks available on the vendor calendar.'
                  : 'This vendor already has a confirmed booking on that date. Choose another day.'}
              </p>
            )}
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
              <button type="submit" className="dash-btn dash-btn--primary" disabled={sending || availability?.available === false}>
                {sending ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {compareIds.length > 0 && (
        <div className="vendor-compare-bar">
          <p>
            {compareIds.length === 1
              ? `${compareVendors[0]?.name || '1 vendor'} added. Click Add to compare on one more listing.`
              : `${compareIds.length} vendors ready to compare`}
          </p>
          <div className="vendor-compare-bar__names">
            {compareVendors.map((vendor) => (
              <button key={vendor.id} type="button" onClick={() => toggleCompare(vendor)}>{vendor.name} ×</button>
            ))}
          </div>
          <button type="button" className="dash-btn dash-btn--primary" disabled={compareVendors.length < 2} onClick={() => setCompareOpen(true)}>
            {compareVendors.length < 2 ? 'Pick one more' : 'View comparison'}
          </button>
          <button type="button" className="dash-btn dash-btn--ghost" onClick={() => { setCompareIds([]); setCompareOpen(false); }}>Clear</button>
        </div>
      )}

      {compareOpen && compareVendors.length >= 2 && (
        <div className="dash-overlay" onClick={() => setCompareOpen(false)}>
          <div className="dash-panel dash-panel--wide vendor-compare-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Compare vendors</h2>
            <p className="vendor-compare-panel__sub">Same details side by side so you can pick who to book.</p>
            <div className="vendor-compare-table-wrap">
              <table className="vendor-compare-table">
                <thead>
                  <tr>
                    <th> </th>
                    {compareVendors.map((vendor) => <th key={vendor.id}>{vendor.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Category</th>
                    {compareVendors.map((vendor) => <td key={`${vendor.id}-cat`}>{formatVendorCategories(vendor)}</td>)}
                  </tr>
                  <tr>
                    <th>District</th>
                    {compareVendors.map((vendor) => <td key={`${vendor.id}-dist`}>{formatVendorDistricts(vendor)}</td>)}
                  </tr>
                  <tr>
                    <th>Price range</th>
                    {compareVendors.map((vendor) => <td key={`${vendor.id}-price`}>{formatPriceRange(vendor.priceRange)}</td>)}
                  </tr>
                  <tr>
                    <th>Rating</th>
                    {compareVendors.map((vendor) => <td key={`${vendor.id}-rate`}>{vendor.rating ? `★ ${vendor.rating}` : '—'}</td>)}
                  </tr>
                  <tr>
                    <th>Packages</th>
                    {compareVendors.map((vendor) => <td key={`${vendor.id}-pkg`}>{vendor.quotations?.length || 0}</td>)}
                  </tr>
                  <tr>
                    <th>Booking status</th>
                    {compareVendors.map((vendor) => {
                      const booking = bookingForVendor(bookings, vendor);
                      return <td key={`${vendor.id}-bk`}>{booking ? displayStatus(booking.status) : 'Not requested'}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="dash-panel__actions">
              {compareVendors.map((vendor) => (
                <button key={`${vendor.id}-open`} type="button" className="dash-btn dash-btn--white" onClick={() => { setCompareOpen(false); setSelectedVendor(vendor); }}>
                  View {vendor.name}
                </button>
              ))}
              <button type="button" className="dash-btn dash-btn--primary" onClick={() => setCompareOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorsPage;
