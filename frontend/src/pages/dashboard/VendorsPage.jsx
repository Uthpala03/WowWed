import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { locationSelectOptions, vendorCategoryOptions } from '../../data/formOptions';
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
import VendorDetailModal, { VendorPackageList } from '../../components/vendor/VendorDetailModal';
import VendorFilterSelect from '../../components/vendor/VendorFilterSelect';

const PRICE_BANDS = [
  { id: 'any', label: 'Any price' },
  { id: 'under200', label: 'Under Rs. 200k', max: 200000 },
  { id: '200to500', label: 'Rs. 200k – 500k', min: 200000, max: 500000 },
  { id: '500to1m', label: 'Rs. 500k – 1M', min: 500000, max: 1000000 },
  { id: 'over1m', label: 'Rs. 1M+', min: 1000000 },
];

const CATEGORY_OPTIONS = [
  { value: 'All Categories', label: 'All Categories', icon: 'vendors' },
  ...vendorCategoryOptions.map((opt) => ({ value: opt.label, label: opt.label, icon: opt.icon })),
];

const LOCATION_OPTIONS = locationSelectOptions({ emptyLabel: 'All districts' });

function quotePriceValue(price) {
  const n = Number(String(price || '').replace(/,/g, ''));
  return n || '';
}

function usableQuotes(quotations = []) {
  return quotations.filter((q) => q?.title?.trim() || q?.price || q?.details?.trim() || q?.pdfUrl || q?.pdfData);
}

function quoteKey(q, index) {
  return String(q?.id || `${q?.title || 'package'}-${index}`);
}

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
  const [bookForm, setBookForm] = useState({ date: '', amount: '', message: '', packageTitle: '', packageId: '' });
  const [availability, setAvailability] = useState(null);
  const [listVersion, setListVersion] = useState(0);
  const [sentNotice, setSentNotice] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const [recommendOn, setRecommendOn] = useState(false);
  const [recommendError, setRecommendError] = useState('');

  useEffect(() => {
    Promise.all([refreshVendorListings(), refreshBookings()])
      .then(() => setListVersion((v) => v + 1))
      .catch(() => {});
  }, []);

  const allVendors = useMemo(() => getVendorListings(), [listVersion]);
  const bookings = coupleData?.bookings || getBookings() || [];

  const requested = useMemo(() => {
    const active = (bookings || []).filter((b) => !['Cancelled', 'Rejected'].includes(b.status));
    const rows = [];
    const seenVendors = new Set();
    const usedBookingIds = new Set();

    active.forEach((booking) => {
      const vendor = allVendors.find((item) => bookingForVendor([booking], item));
      if (!vendor || seenVendors.has(vendor.id)) return;
      seenVendors.add(vendor.id);
      usedBookingIds.add(booking.id);
      rows.push({ vendor, booking });
    });

    active.forEach((booking) => {
      if (usedBookingIds.has(booking.id)) return;
      rows.push({
        vendor: {
          id: booking.vendorListingId || booking.id,
          name: booking.vendorName,
          category: booking.category,
          categories: booking.category ? [booking.category] : [],
          city: '',
          district: '',
          districts: [],
          priceRange: String(booking.amount || ''),
          quotations: [],
          portfolioImages: [],
        },
        booking,
      });
    });

    return rows;
  }, [allVendors, bookings]);

  const smart = useMemo(
    () => recommendSmartVendors(allVendors, profile, { limit: 24, perCategory: 3 }),
    [allVendors, profile],
  );

  const priceBand = PRICE_BANDS.find((item) => item.id === priceBandId) || PRICE_BANDS[0];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const matchesVendorFilters = (vendor) => {
      const matchCat = vendorMatchesCategory(vendor, category);
      const matchCity = recommendOn || vendorMatchesDistrict(vendor, city);
      const matchPrice = vendorFitsPriceBand(vendor, priceBand);
      const matchRating = !minRating || Number(vendor.rating || 0) >= minRating;
      const matchSearch = !q || (
        vendor.name.toLowerCase().includes(q)
        || locationSearchText(vendor).includes(q)
        || (vendor.description || '').toLowerCase().includes(q)
      );
      return matchCat && matchCity && matchPrice && matchRating && matchSearch;
    };
    if (recommendOn) {
      return smart.matches.map((row) => row.vendor).filter(matchesVendorFilters);
    }
    return allVendors.filter(matchesVendorFilters);
  }, [allVendors, category, city, search, priceBand, minRating, recommendOn, smart.matches]);

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

  const openBooking = (vendor, quote) => {
    const existing = bookingForVendor(bookings, vendor);
    if (existing && !['Rejected', 'Cancelled'].includes(existing.status)) {
      setSelectedVendor(vendor);
      return;
    }
    setSelectedVendor(null);
    setBookingVendor(vendor);
    const quotes = usableQuotes(vendor.quotations || []);
    const chosen = quote || quotes[0];
    const chosenIndex = Math.max(0, quotes.findIndex((q) => q === chosen || (chosen?.id && q.id === chosen.id)));
    setBookForm({
      date: profile?.weddingDate || '',
      amount: chosen ? String(quotePriceValue(chosen.price) || '') : '',
      message: '',
      packageTitle: chosen?.title || '',
      packageId: chosen ? quoteKey(chosen, chosenIndex) : '',
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
    if (usableQuotes(bookingVendor.quotations || []).length > 0 && !bookForm.packageTitle && !bookForm.packageId) {
      setSendError('Please select a package.');
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
      setBookForm({ date: '', amount: '', message: '', packageTitle: '', packageId: '' });
      setSentNotice(`${bookingVendor.name} has been notified. Track the reply under Requests.`);
    } catch (err) {
      setSendError(err.message || 'Could not send this request.');
    } finally {
      setSending(false);
    }
  };

  const selectedBooking = bookingForVendor(bookings, selectedVendor);

  const canRecommend = Boolean(profile?.district || profile?.ceremonyType || Number(profile?.budget) > 0);
  const toggleRecommend = () => {
    if (recommendOn) {
      setRecommendOn(false);
      setRecommendError('');
      return;
    }
    if (!canRecommend) {
      setRecommendError('Add your district, budget, and wedding type in your wedding profile first.');
      return;
    }
    setRecommendError('');
    setRecommendOn(true);
  };

  const recommendSummary = [
    profile?.district,
    profile?.ceremonyType,
    Number(profile?.budget) > 0 ? `Rs. ${Number(profile.budget).toLocaleString()}` : '',
  ].filter(Boolean).join(' · ');

  const listTitle = recommendOn
    ? 'Matched to your wedding'
    : (category !== 'All Categories' ? category : 'All vendors');
  const listSubtitle = recommendOn
    ? `Rule-based match — district, budget, and wedding type${recommendSummary ? ` · ${recommendSummary}` : ''}`
    : `${filtered.length} listing${filtered.length === 1 ? '' : 's'}${city ? ` in ${city}` : ' in the catalogue'}`;

  return (
    <div className="dash-page vendors-page">
      <PageHeader moduleId="vendors" title="Find Your Perfect Wedding Vendors" className="vendors-hero" />
      <div className="vendor-search-bar vendor-search-bar--standalone">
        <VendorFilterSelect
          label="Category"
          value={category}
          options={CATEGORY_OPTIONS}
          onChange={setCategory}
        />
        <VendorFilterSelect
          label="Location"
          value={city}
          options={LOCATION_OPTIONS}
          onChange={setCity}
          placeholder="All districts"
        />
        <input placeholder="Search vendors, places…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button
          type="button"
          className={`vendor-search-bar__recommend${recommendOn ? ' is-on' : ''}`}
          onClick={toggleRecommend}
        >
          {recommendOn ? 'Matched' : 'Match'}
        </button>
      </div>
      <div className="vendor-filter-row">
        <VendorFilterSelect
          label="Price"
          icon="budget"
          value={priceBandId}
          options={PRICE_BANDS.map((band) => ({ value: band.id, label: band.label, icon: 'budget' }))}
          onChange={setPriceBandId}
        />
        <VendorFilterSelect
          label="Rating"
          icon="sparkle"
          value={minRating}
          options={[
            { value: 0, label: 'Any rating', icon: 'sparkle' },
            { value: 4, label: '4.0 and up', icon: 'sparkle' },
            { value: 4.5, label: '4.5 and up', icon: 'sparkle' },
            { value: 4.8, label: '4.8 and up', icon: 'sparkle' },
          ]}
          onChange={(value) => setMinRating(Number(value))}
        />
        <p>{filtered.length} matching listing{filtered.length === 1 ? '' : 's'} · Add 2–3 to compare side by side</p>
      </div>
      {recommendError && (
        <p className="vendor-recommend-note vendor-recommend-note--error">
          {recommendError} <Link to="/wedding-profile">Open wedding profile</Link>
        </p>
      )}

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
              <h2>Your chosen vendors</h2>
              <p>These stay here while you pick more vendors. Open Requests to hire or track replies.</p>
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

      <section className="vendors-section">
        <div className="vendor-board__head vendor-board__head--plain vendor-results-head">
          <div>
            {category !== 'All Categories' && !recommendOn && (
              <p className="vendor-results-kicker">Category</p>
            )}
            <h2>{listTitle}</h2>
            <p>{listSubtitle}</p>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="vendor-board__empty">
            {recommendOn
              ? 'No vendors matched your district, budget, and wedding type. Click Match to show the full list.'
              : 'No listings match these filters.'}
          </p>
        ) : (
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
        )}
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

            {usableQuotes(bookingVendor.quotations || []).length > 0 && (
              <div className="dash-field">
                <span>Package</span>
                <VendorPackageList
                  quotes={usableQuotes(bookingVendor.quotations || [])}
                  selectedId={bookForm.packageId}
                  onSelect={(quote, id) => {
                    setBookForm({
                      ...bookForm,
                      packageId: id,
                      packageTitle: quote.title || '',
                      amount: String(quotePriceValue(quote.price) || bookForm.amount),
                    });
                  }}
                />
              </div>
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
