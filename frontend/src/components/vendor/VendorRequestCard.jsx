import { useState } from 'react';
import {
  awaitingCouple,
  displayStatus,
  isPaid,
  needsVendorReply,
  statusTone,
  vendorCanRespond,
} from '../../utils/bookingStatus';

function initials(name) {
  return String(name || 'C')
    .split(/[&\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function VendorRequestCard({ booking, busyId, onRespond }) {
  const [offerOpen, setOfferOpen] = useState(false);
  const [form, setForm] = useState({
    amount: String(booking.amount || ''),
    vendorNote: booking.vendorNote || '',
  });

  return (
    <article className={`vendor-request${needsVendorReply(booking.status) ? ' vendor-request--new' : ''}`}>
      <div className="vendor-request__top">
        <span className="vendor-inbox__avatar">{initials(booking.coupleName)}</span>
        <div>
          <strong>{booking.coupleName || 'Couple'}</strong>
          <small>{booking.coupleEmail || 'No email'} · {booking.date || 'Date TBC'}</small>
        </div>
        <span className={`rsvp-badge rsvp-badge--${statusTone(booking.status)}`}>{displayStatus(booking.status)}</span>
      </div>
      <p className="vendor-request__amount">Rs. {Number(booking.amount || 0).toLocaleString()}</p>
      {booking.message ? <p className="vendor-request__note"><span>Couple</span> {booking.message}</p> : null}
      {booking.vendorNote ? <p className="vendor-request__note vendor-request__note--you"><span>You</span> {booking.vendorNote}</p> : null}

      {isPaid(booking.status) && (
        <p className="vendor-request__hint">Paid — this amount is in the couple’s wedding budget and counts as earnings.</p>
      )}
      {awaitingCouple(booking.status) && (
        <p className="vendor-request__hint">Waiting for the couple to confirm hire.</p>
      )}

      {vendorCanRespond(booking.status) && (
        <div className="vendor-request__actions">
          {needsVendorReply(booking.status) && (
            <>
              <button type="button" className="dash-btn dash-btn--primary" disabled={busyId === booking.id} onClick={() => onRespond(booking.id, 'Confirmed')}>Accept</button>
              <button type="button" className="dash-btn dash-btn--outline" disabled={busyId === booking.id} onClick={() => onRespond(booking.id, 'Rejected')}>Decline</button>
            </>
          )}
          <button
            type="button"
            className="dash-btn dash-btn--white"
            onClick={() => {
              setOfferOpen((open) => !open);
              setForm({
                amount: String(booking.amount || ''),
                vendorNote: booking.vendorNote || '',
              });
            }}
          >
            Negotiate
          </button>
        </div>
      )}

      {offerOpen && (
        <form
          className="request-update"
          onSubmit={(e) => {
            e.preventDefault();
            onRespond(booking.id, 'Negotiating', {
              amount: Number(form.amount) || booking.amount,
              vendorNote: form.vendorNote,
            });
            setOfferOpen(false);
          }}
        >
          <label className="dash-field">
            <span>Counter-offer amount (LKR)</span>
            <input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </label>
          <label className="dash-field">
            <span>Note to the couple</span>
            <textarea rows={3} value={form.vendorNote} onChange={(e) => setForm({ ...form, vendorNote: e.target.value })} placeholder="Availability, package change, or extra cost…" />
          </label>
          <div className="dash-panel__actions">
            <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setOfferOpen(false)}>Cancel</button>
            <button type="submit" className="dash-btn dash-btn--primary" disabled={busyId === booking.id}>Send counter-offer</button>
          </div>
        </form>
      )}
    </article>
  );
}

export default VendorRequestCard;
