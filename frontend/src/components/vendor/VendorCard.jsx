import { quoteHasPdf, resolveUploadUrl } from '../../utils/uploadUrl';
import {
  formatVendorCategories,
  formatVendorDistricts,
  vendorLocations,
} from '../../utils/vendorMeta';
import { displayStatus, statusTone } from '../../utils/bookingStatus';

function formatQuotePrice(price) {
  const n = Number(String(price || '').replace(/,/g, ''));
  return n ? `Rs. ${n.toLocaleString()}` : '—';
}

function VendorCard({
  vendor,
  rank,
  booking,
  matchChips,
  ctaLabel = 'View details',
  onOpen,
  comparing = false,
  compareDisabled = false,
  onToggleCompare,
  preview = false,
}) {
  const cover = vendor.portfolioImages?.[0];
  const photoCount = vendor.portfolioImages?.length || 0;
  const places = vendorLocations(vendor);
  const name = vendor.name || vendor.businessName || 'Vendor';

  return (
    <article
      className={`vendor-card vendor-card--gallery${preview ? '' : ' vendor-card--clickable'}${booking ? ' vendor-card--requested' : ''}${comparing ? ' vendor-card--compare' : ''}`}
      onClick={preview ? undefined : () => onOpen(vendor)}
      onKeyDown={preview ? undefined : (e) => e.key === 'Enter' && onOpen(vendor)}
      role={preview ? undefined : 'button'}
      tabIndex={preview ? undefined : 0}
    >
      <div className="vendor-card__image">
        {cover ? (
          <img src={resolveUploadUrl(cover)} alt="" className="vendor-card__photo" />
        ) : (
          <span className="vendor-card__photo-fallback">{name[0]}</span>
        )}
        <div className="vendor-card__image-fade" />
        {typeof rank === 'number' && <span className="vendor-rank">#{rank}</span>}
        {vendor.spotlight && <span className="vendor-spotlight">💍 Spotlight</span>}
        {booking && (
          <span className={`vendor-requested-badge rsvp-badge rsvp-badge--${statusTone(booking.status)}`}>
            {booking.status === 'Pending' ? 'Request sent' : displayStatus(booking.status)}
          </span>
        )}
        {photoCount > 0 && (
          <span className="vendor-card__photo-count">
            {photoCount} photo{photoCount === 1 ? '' : 's'}
          </span>
        )}
      </div>
      <div className="vendor-card__body">
        <div className="vendor-avatar">{name[0]}</div>
        <div>
          <strong>{name}</strong>
          <small>{formatVendorCategories(vendor)}</small>
          <small>{formatVendorDistricts(vendor)} {vendor.rating ? `· ★ ${vendor.rating}` : ''}</small>
        </div>
      </div>
      {matchChips?.length > 0 && (
        <div className="vendor-match-chips">
          {matchChips.map((chip) => (
            <span key={chip} className="vendor-match-chip">{chip}</span>
          ))}
        </div>
      )}
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
          {vendor.quotations?.length > 0
            ? `${vendor.quotations.length} package${vendor.quotations.length > 1 ? 's' : ''} from ${formatQuotePrice(vendor.quotations[0].price)}`
            : 'Packages available'}
        </p>
      )}
      <div className="vendor-card__actions">
        {onToggleCompare && (
          <button
            type="button"
            className={`dash-btn dash-btn--white vendor-card__compare${comparing ? ' is-on' : ''}`}
            disabled={compareDisabled && !comparing}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(vendor);
            }}
          >
            {comparing ? 'Added ✓' : 'Add to compare'}
          </button>
        )}
        <button
          type="button"
          className="dash-btn dash-btn--primary vendor-card__cta"
          onClick={(e) => {
            e.stopPropagation();
            if (!preview) onOpen(vendor);
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </article>
  );
}

export default VendorCard;
