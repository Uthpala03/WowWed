import { useState } from 'react';
import { Link } from 'react-router-dom';
import { quoteHasPdf, quotePdfHref, resolveUploadUrl } from '../../utils/uploadUrl';
import { formatVendorCategories, formatVendorDistricts, vendorLocations } from '../../utils/vendorMeta';
import { displayStatus } from '../../utils/bookingStatus';

function formatQuotePrice(price) {
  const n = Number(String(price || '').replace(/,/g, ''));
  return n ? `Rs. ${n.toLocaleString()}` : 'Price on request';
}

function hasQuoteContent(q) {
  return Boolean(
    q?.title?.trim()
    || q?.price
    || q?.details?.trim()
    || q?.pdfUrl
    || q?.pdfData,
  );
}

function activeQuotes(quotations = []) {
  return quotations.filter(hasQuoteContent);
}

function formatPriceRange(range) {
  if (!range) return 'Price on request';
  const [min, max] = String(range).split('-').map((n) => Number(n.trim()));
  if (!min && !max) return 'Price on request';
  const fmt = (n) => (n ? `Rs. ${n.toLocaleString()}` : '');
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max);
}

function PdfCard({ href, title, subtitle }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="vendor-detail__pdf-card">
      <span className="vendor-detail__pdf-icon">📄</span>
      <span>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
    </a>
  );
}

function VendorDetailModal({ vendor, onClose, onRequestBooking, existingBooking }) {
  const [activeImage, setActiveImage] = useState(0);
  if (!vendor) return null;

  const images = vendor.portfolioImages || [];
  const quotes = activeQuotes(vendor.quotations || []);
  const pdfQuotes = quotes.filter(quoteHasPdf);
  const mainPdf = vendor.quotationPdf;
  const hasAnyPdf = mainPdf?.url || pdfQuotes.length > 0;
  const cover = images[activeImage] || images[0];
  const places = vendorLocations(vendor);

  return (
    <div className="vendor-detail-overlay" onClick={onClose} role="presentation">
      <div className="vendor-detail" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="vendor-detail__close" onClick={onClose} aria-label="Close">×</button>

        <div className="vendor-detail__hero">
          {cover ? (
            <img
              src={resolveUploadUrl(cover)}
              alt={`${vendor.name} portfolio`}
              className="vendor-detail__hero-img"
            />
          ) : (
            <span className="vendor-detail__hero-placeholder">{vendor.name[0]}</span>
          )}
          {vendor.spotlight && <span className="vendor-detail__spotlight">💍 Spotlight vendor</span>}
          {images.length > 0 && (
            <span className="vendor-detail__photo-count">{images.length} photo{images.length === 1 ? '' : 's'}</span>
          )}
        </div>

        {images.length > 1 && (
          <div className="vendor-detail__gallery">
            {images.map((src, i) => (
              <button
                key={src.slice(0, 40) + i}
                type="button"
                className={`vendor-detail__thumb${activeImage === i ? ' is-on' : ''}`}
                onClick={() => setActiveImage(i)}
              >
                <img src={resolveUploadUrl(src)} alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="vendor-detail__body">
          <div className="vendor-detail__head">
            <div className="vendor-avatar vendor-detail__avatar">{vendor.name[0]}</div>
            <div>
              <h2>{vendor.name}</h2>
              <p className="vendor-detail__meta">
                {formatVendorCategories(vendor)} · {formatVendorDistricts(vendor)}
                {vendor.rating ? ` · ★ ${vendor.rating}` : ''}
              </p>
            </div>
          </div>

          {places.length > 0 && (
            <section className="vendor-detail__section">
              <h3>Branches &amp; locations</h3>
              <div className="vendor-detail__places">
                {places.map((place) => (
                  <article key={`${place.name}-${place.city}`} className="vendor-detail__place">
                    <strong>{place.name}</strong>
                    <small>
                      {[place.city, place.district].filter(Boolean).join(' · ')}
                      {place.type === 'hall' ? ' · venue space' : place.type === 'branch' && places.length > 1 ? ' · branch' : ''}
                    </small>
                  </article>
                ))}
              </div>
            </section>
          )}
          {hasAnyPdf && (
            <section className="vendor-detail__section vendor-detail__section--pdf">
              <h3>📄 Quotation &amp; package PDFs</h3>
              <p className="vendor-detail__pdf-note">Download the vendor&apos;s price list and package details.</p>
              <div className="vendor-detail__pdf-list">
                {mainPdf?.url && (
                  <PdfCard
                    href={resolveUploadUrl(mainPdf.url)}
                    title="Full quotation document"
                    subtitle={`${mainPdf.name} · Click to open`}
                  />
                )}
                {pdfQuotes.map((q) => (
                  <PdfCard
                    key={q.id}
                    href={quotePdfHref(q)}
                    title={q.title?.trim() || q.pdfName}
                    subtitle={`${q.pdfName} · Click to open`}
                  />
                ))}
              </div>
            </section>
          )}

          {vendor.description?.trim() && (
            <section className="vendor-detail__section">
              <h3>About</h3>
              <p>{vendor.description}</p>
            </section>
          )}

          {(vendor.phone || vendor.ownerEmail || vendor.website || vendor.address) && (
            <section className="vendor-detail__section">
              <h3>Contact</h3>
              {vendor.address ? <p>{vendor.address}</p> : null}
              {vendor.phone ? <p>Phone: {vendor.phone}</p> : null}
              {vendor.ownerEmail ? (
                <p>Email: <a href={`mailto:${vendor.ownerEmail}`}>{vendor.ownerEmail}</a></p>
              ) : null}
              {vendor.website ? (
                <p>
                  Web:{' '}
                  <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noopener noreferrer">
                    {vendor.website}
                  </a>
                </p>
              ) : null}
            </section>
          )}

          {quotes.length > 0 ? (
            <section className="vendor-detail__section">
              <h3>Packages &amp; pricing</h3>
              <div className="vendor-detail__packages">
                {quotes.map((q) => (
                  <article key={q.id} className="vendor-detail__package">
                    <div className="vendor-detail__package-top">
                      <strong>{q.title?.trim() || 'Package'}</strong>
                      <em>{formatQuotePrice(q.price)}</em>
                    </div>
                    {q.details?.trim() && <p>{q.details}</p>}
                    {quoteHasPdf(q) && (
                      <a href={quotePdfHref(q)} target="_blank" rel="noopener noreferrer" className="vendor-detail__pdf">
                        📄 View package PDF
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ) : !hasAnyPdf && (
            <section className="vendor-detail__section">
              <h3>Pricing</h3>
              <p className="vendor-detail__price-range">{formatPriceRange(vendor.priceRange)}</p>
            </section>
          )}
        </div>

        <div className="vendor-detail__footer">
          <button type="button" className="dash-btn dash-btn--ghost" onClick={onClose}>Close</button>
          {existingBooking && !['Rejected', 'Cancelled'].includes(existingBooking.status) ? (
            <Link to="/dashboard/bookings" className="dash-btn dash-btn--primary">
              Request {existingBooking.status === 'Pending' ? 'sent' : displayStatus(existingBooking.status)} — open Requests
            </Link>
          ) : (
            <button type="button" className="dash-btn dash-btn--primary" onClick={() => onRequestBooking(vendor)}>
              Send booking request →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VendorDetailModal;
