import { useState } from 'react';
import { quoteHasPdf, quotePdfHref, resolveUploadUrl } from '../../utils/uploadUrl';

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

function VendorDetailModal({ vendor, onClose, onRequestBooking }) {
  const [activeImage, setActiveImage] = useState(0);
  if (!vendor) return null;

  const images = vendor.portfolioImages || [];
  const quotes = activeQuotes(vendor.quotations || []);
  const pdfQuotes = quotes.filter(quoteHasPdf);
  const mainPdf = vendor.quotationPdf;
  const hasAnyPdf = mainPdf?.url || pdfQuotes.length > 0;
  const cover = images[activeImage] || images[0];
  const location = vendor.city || vendor.district || 'Sri Lanka';

  return (
    <div className="vendor-detail-overlay" onClick={onClose} role="presentation">
      <div className="vendor-detail" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="vendor-detail__close" onClick={onClose} aria-label="Close">×</button>

        <div className="vendor-detail__hero">
          {cover ? (
            <img
              src={cover}
              alt={`${vendor.name} portfolio`}
              className="vendor-detail__hero-img"
            />
          ) : (
            <span className="vendor-detail__hero-placeholder">{vendor.name[0]}</span>
          )}
          {vendor.spotlight && <span className="vendor-detail__spotlight">💍 Spotlight vendor</span>}
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
                <img src={src} alt="" />
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
                {vendor.category} · {location}
                {vendor.rating ? ` · ★ ${vendor.rating}` : ''}
              </p>
            </div>
          </div>

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
          <button type="button" className="dash-btn dash-btn--primary" onClick={() => onRequestBooking(vendor)}>
            Send booking request →
          </button>
        </div>
      </div>
    </div>
  );
}

export default VendorDetailModal;
