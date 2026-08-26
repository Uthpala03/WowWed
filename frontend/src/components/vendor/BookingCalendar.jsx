import { useEffect, useMemo, useRef, useState } from 'react';
import { bookingDateKey, calendarKind, displayStatus } from '../../utils/bookingStatus';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-LK', { month: 'long', year: 'numeric' });
}

function toKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function cursorFromBookings(bookings) {
  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());
  const dates = (bookings || [])
    .map((booking) => bookingDateKey(booking))
    .filter(Boolean)
    .sort();
  const focus = dates.find((date) => date >= todayKey) || dates[0];
  if (!focus) return { year: today.getFullYear(), month: today.getMonth() };
  const [year, month] = focus.split('-').map(Number);
  return { year, month: month - 1 };
}

function BookingCalendar({ bookings = [], selectedDate, onSelectDate, compact = false }) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => cursorFromBookings(bookings));
  const jumped = useRef(false);

  useEffect(() => {
    if (jumped.current) return;
    const hasDates = (bookings || []).some((booking) => bookingDateKey(booking));
    if (!hasDates) return;
    jumped.current = true;
    setCursor(cursorFromBookings(bookings));
  }, [bookings]);

  const byDate = useMemo(() => {
    const map = {};
    bookings.forEach((booking) => {
      const key = bookingDateKey(booking);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(booking);
    });
    return map;
  }, [bookings]);

  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const items = [];
    for (let i = 0; i < startPad; i += 1) items.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      items.push(day);
    }
    return items;
  }, [cursor]);

  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());
  const dayBookings = selectedDate ? (byDate[selectedDate] || []) : [];

  const shiftMonth = (delta) => {
    setCursor((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <section className={`booking-cal${compact ? ' booking-cal--compact' : ''}`}>
      <div className="booking-cal__head">
        <div>
          <p className="booking-cal__kicker">Booking calendar</p>
          <h2>{monthLabel(cursor.year, cursor.month)}</h2>
        </div>
        <div className="booking-cal__nav">
          <button type="button" className="dash-btn dash-btn--ghost" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
          <button
            type="button"
            className="dash-btn dash-btn--white"
            onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() })}
          >
            Today
          </button>
          <button type="button" className="dash-btn dash-btn--ghost" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
        </div>
      </div>

      <div className="booking-cal__week">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="booking-cal__grid">
        {cells.map((day, index) => {
          if (!day) return <div key={`pad-${index}`} className="booking-cal__cell is-pad" />;
          const key = toKey(cursor.year, cursor.month, day);
          const items = byDate[key] || [];
          const kinds = [...new Set(items.map((item) => calendarKind(item.status)).filter(Boolean))];
          const selected = selectedDate === key;
          return (
            <button
              key={key}
              type="button"
              className={`booking-cal__cell${selected ? ' is-on' : ''}${key === todayKey ? ' is-today' : ''}${items.length ? ' has-bookings' : ''}`}
              onClick={() => onSelectDate(selected ? '' : key)}
            >
              <em>{day}</em>
              {kinds.length > 0 && (
                <span className="booking-cal__dots">
                  {kinds.slice(0, 3).map((kind) => (
                    <i key={kind} className={`booking-cal__dot booking-cal__dot--${kind}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="booking-cal__legend">
        <span><i className="booking-cal__dot booking-cal__dot--pending" /> Pending</span>
        <span><i className="booking-cal__dot booking-cal__dot--negotiate" /> Negotiate</span>
        <span><i className="booking-cal__dot booking-cal__dot--confirmed" /> Confirmed</span>
        <span><i className="booking-cal__dot booking-cal__dot--paid" /> Paid</span>
      </div>

      {selectedDate ? (
        <div className="booking-cal__day">
          <div className="booking-cal__day-head">
            <strong>
              {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-LK', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </strong>
            <button type="button" className="dash-btn dash-btn--ghost" onClick={() => onSelectDate('')}>Clear</button>
          </div>
          {dayBookings.length === 0 ? (
            <p className="booking-cal__empty">No bookings on this date.</p>
          ) : (
            <ul>
              {dayBookings.map((booking) => (
                <li key={booking.id}>
                  <span>{booking.coupleName || 'Couple'}</span>
                  <em>{displayStatus(booking.status)}</em>
                  <small>Rs. {Number(booking.amount || 0).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="booking-cal__hint">Select a date to see that day’s requests and confirmed bookings.</p>
      )}
    </section>
  );
}

export default BookingCalendar;
