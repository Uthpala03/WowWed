import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  coupleCanAcceptOffer,
  coupleCanCancel,
  coupleCanHire,
  coupleCanReply,
  displayStatus,
  isPaid,
  statusTone,
  canonicalizeStatus,
} from '../../utils/bookingStatus';

const STATUS_COPY = {
  Pending: 'Waiting for the vendor to reply.',
  Countered: 'Your reply was sent. Waiting for the vendor.',
  Confirmed: 'Vendor accepted. Confirm the booking to add it to your budget.',
  Accepted: 'Vendor accepted. Confirm the booking to add it to your budget.',
  Negotiating: 'Vendor sent a counter-offer. Accept it, reply, confirm, or cancel.',
  Updated: 'Vendor sent a counter-offer. Accept it, reply, confirm, or cancel.',
  Rejected: 'Vendor declined this request.',
  Paid: 'This booking is confirmed and in your budget.',
  Hired: 'This booking is confirmed and in your budget.',
  Cancelled: 'You cancelled this request.',
};

function CoupleRequestCard({ booking, busyId, onRespond, compact }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [form, setForm] = useState({
    amount: String(booking.amount || ''),
    coupleNote: booking.coupleNote || '',
  });
  const busy = busyId === booking.id;

  return (
    <article className={`request-card${coupleCanHire(booking.status) ? ' request-card--action' : ''}${compact ? ' request-card--compact' : ''}`}>
      <div className="request-card__top">
        <div>
          <strong>{booking.vendorName}</strong>
          <small>{booking.category || 'Wedding vendor'} · {booking.date || 'Date TBC'}</small>
        </div>
        <span className={`rsvp-badge rsvp-badge--${statusTone(booking.status)}`}>{displayStatus(booking.status)}</span>
      </div>

      <p className="request-card__amount">Rs. {Number(booking.amount || 0).toLocaleString()}</p>
      <p className="request-card__copy">{STATUS_COPY[booking.status] || STATUS_COPY[canonicalizeStatus(booking.status)] || booking.status}</p>

      {booking.message ? (
        <p className="request-card__note"><span>You</span> {booking.message}</p>
      ) : null}
      {booking.vendorNote ? (
        <p className="request-card__note request-card__note--vendor"><span>Vendor</span> {booking.vendorNote}</p>
      ) : null}
      {booking.coupleNote ? (
        <p className="request-card__note"><span>Your reply</span> {booking.coupleNote}</p>
      ) : null}

      <div className="request-card__actions">
        {coupleCanHire(booking.status) && (
          <button
            type="button"
            className="dash-btn dash-btn--primary"
            disabled={busy}
            onClick={() => onRespond(booking.id, 'Paid')}
          >
            {busy ? 'Saving…' : 'Confirm booking'}
          </button>
        )}
        {coupleCanAcceptOffer(booking.status) && (
          <button
            type="button"
            className="dash-btn dash-btn--white"
            disabled={busy}
            onClick={() => onRespond(booking.id, 'Confirmed')}
          >
            Accept this offer
          </button>
        )}
        {coupleCanReply(booking.status) && (
          <button
            type="button"
            className="dash-btn dash-btn--white"
            disabled={busy}
            onClick={() => {
              setReplyOpen((open) => !open);
              setForm({
                amount: String(booking.amount || ''),
                coupleNote: booking.coupleNote || '',
              });
            }}
          >
            {replyOpen ? 'Hide reply' : 'Negotiate reply'}
          </button>
        )}
        {coupleCanCancel(booking.status) && (
          <button
            type="button"
            className="dash-btn dash-btn--outline"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Cancel the booking with ${booking.vendorName}?`)) {
                onRespond(booking.id, 'Cancelled');
              }
            }}
          >
            Cancel booking
          </button>
        )}
        {isPaid(booking.status) && (
          <Link to="/dashboard/budget" className="dash-btn dash-btn--white">View in budget</Link>
        )}
      </div>

      {replyOpen && (
        <form
          className="request-update"
          onSubmit={(e) => {
            e.preventDefault();
            onRespond(booking.id, 'Countered', {
              amount: Number(form.amount) || booking.amount,
              coupleNote: form.coupleNote,
            });
            setReplyOpen(false);
          }}
        >
          <label className="dash-field">
            <span>Your offer (LKR)</span>
            <input
              type="number"
              min="0"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </label>
          <label className="dash-field">
            <span>Message to the vendor</span>
            <textarea
              rows={3}
              required
              value={form.coupleNote}
              onChange={(e) => setForm({ ...form, coupleNote: e.target.value })}
              placeholder="Ask about the price, package, or date…"
            />
          </label>
          <div className="dash-panel__actions">
            <button type="button" className="dash-btn dash-btn--ghost" onClick={() => setReplyOpen(false)}>Close</button>
            <button type="submit" className="dash-btn dash-btn--primary" disabled={busy}>
              Send reply to vendor
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

export default CoupleRequestCard;
