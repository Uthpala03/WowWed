import { useState } from 'react';
import {
  awaitingCouple,
  displayStatus,
  isPaid,
  statusTone,
  vendorCanRespond,
  vendorNeedsDecision,
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
  const [panel, setPanel] = useState('');
  const [form, setForm] = useState({
    amount: String(booking.amount || ''),
    vendorNote: booking.vendorNote || '',
  });
  const busy = busyId === booking.id;
  const showActions = vendorNeedsDecision(booking.status) || vendorCanRespond(booking.status);

  const openPanel = (name) => {
    setPanel((current) => (current === name ? '' : name));
    setForm({
      amount: String(booking.amount || ''),
      vendorNote: booking.vendorNote || '',
    });
  };

  return (
    <article className={`vendor-request${vendorNeedsDecision(booking.status) ? ' vendor-request--new' : ''}`}>
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
      {booking.coupleNote ? <p className="vendor-request__note"><span>Couple reply</span> {booking.coupleNote}</p> : null}
      {booking.vendorNote ? <p className="vendor-request__note vendor-request__note--you"><span>You</span> {booking.vendorNote}</p> : null}

      {isPaid(booking.status) && (
        <p className="vendor-request__hint">Booked — this amount is in the couple’s budget and counts as earnings.</p>
      )}
      {awaitingCouple(booking.status) && !vendorNeedsDecision(booking.status) && (
        <p className="vendor-request__hint">Waiting for the couple to confirm the booking.</p>
      )}
      {vendorNeedsDecision(booking.status) && (
        <p className="vendor-request__hint">Accept, reply, reject, or send a new offer.</p>
      )}

      {showActions && !isPaid(booking.status) && booking.status !== 'Rejected' && booking.status !== 'Cancelled' && (
        <div className="vendor-request__actions">
          <button
            type="button"
            className="dash-btn dash-btn--primary"
            disabled={busy}
            onClick={() => onRespond(booking.id, 'Confirmed')}
          >
            Accept
          </button>
          <button
            type="button"
            className="dash-btn dash-btn--white"
            disabled={busy}
            onClick={() => openPanel('reply')}
          >
            {panel === 'reply' ? 'Hide reply' : 'Reply'}
          </button>
          <button
            type="button"
            className="dash-btn dash-btn--outline"
            disabled={busy}
            onClick={() => onRespond(booking.id, 'Rejected')}
          >
            Reject
          </button>
          <button
            type="button"
            className="dash-btn dash-btn--white"
            disabled={busy}
            onClick={() => openPanel('negotiate')}
          >
            {panel === 'negotiate' ? 'Hide offer' : 'Negotiate'}
          </button>
        </div>
      )}

      {panel === 'reply' && (
        <form
          className="request-update"
          onSubmit={(e) => {
            e.preventDefault();
            onRespond(booking.id, 'Negotiating', {
              amount: booking.amount,
              vendorNote: form.vendorNote,
            });
            setPanel('');
          }}
        >
          <label className="dash-field">
            <span>Reply to the couple</span>
            <textarea
              rows={3}
              required
              value={form.vendorNote}
              onChange={(e) => setForm({ ...form, vendorNote: e.target.value })}
              placeholder="Answer their question or confirm details…"
            />
          </label>
          <div className="dash-panel__actions">
            <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setPanel('')}>Close</button>
            <button type="submit" className="dash-btn dash-btn--primary" disabled={busy}>Send reply</button>
          </div>
        </form>
      )}

      {panel === 'negotiate' && (
        <form
          className="request-update"
          onSubmit={(e) => {
            e.preventDefault();
            onRespond(booking.id, 'Negotiating', {
              amount: Number(form.amount) || booking.amount,
              vendorNote: form.vendorNote,
            });
            setPanel('');
          }}
        >
          <label className="dash-field">
            <span>Your offer (LKR)</span>
            <input type="number" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </label>
          <label className="dash-field">
            <span>Note to the couple</span>
            <textarea rows={3} value={form.vendorNote} onChange={(e) => setForm({ ...form, vendorNote: e.target.value })} placeholder="Availability, package change, or extra cost…" />
          </label>
          <div className="dash-panel__actions">
            <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setPanel('')}>Close</button>
            <button type="submit" className="dash-btn dash-btn--primary" disabled={busy}>Send offer</button>
          </div>
        </form>
      )}
    </article>
  );
}

export default VendorRequestCard;
