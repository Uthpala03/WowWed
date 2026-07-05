const express = require('express');
const { query } = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function formatDateValue(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function bookingFromRow(row) {
  return {
    id: row.id,
    vendorName: row.vendor_name,
    vendorEmail: row.vendor_email || '',
    coupleName: row.couple_name,
    coupleEmail: row.couple_email,
    date: formatDateValue(row.booking_date),
    amount: row.amount ? Number(row.amount) : 0,
    message: row.message || '',
    status: row.status,
    createdAt: row.created_at,
  };
}

router.get('/', authRequired, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'vendor') {
      const userRows = await query('SELECT email FROM users WHERE id = :id', { id: req.user.id });
      const email = userRows[0]?.email;
      rows = await query(
        'SELECT * FROM bookings WHERE vendor_email = :email ORDER BY created_at DESC',
        { email },
      );
    } else {
      rows = await query(
        'SELECT * FROM bookings WHERE couple_user_id = :userId ORDER BY created_at DESC',
        { userId: req.user.id },
      );
    }
    res.json({ bookings: rows.map(bookingFromRow) });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Could not load bookings.' });
  }
});

router.post('/', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'couple') {
      res.status(403).json({ error: 'Only couples can create bookings.' });
      return;
    }

    const b = req.body;
    const id = b.id || `bk${Date.now()}`;

    await query(
      `INSERT INTO bookings
       (id, couple_user_id, vendor_name, vendor_email, couple_name, couple_email, booking_date, amount, message, status)
       VALUES (:id, :coupleUserId, :vendorName, :vendorEmail, :coupleName, :coupleEmail, :date, :amount, :message, :status)`,
      {
        id,
        coupleUserId: req.user.id,
        vendorName: b.vendorName,
        vendorEmail: b.vendorEmail || null,
        coupleName: b.coupleName,
        coupleEmail: b.coupleEmail,
        date: b.date || null,
        amount: Number(b.amount) || 0,
        message: b.message || '',
        status: b.status || 'Pending',
      },
    );

    const rows = await query('SELECT * FROM bookings WHERE id = :id', { id });
    res.status(201).json({ booking: bookingFromRow(rows[0]) });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Could not create booking.' });
  }
});

router.put('/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user.role === 'vendor') {
      const userRows = await query('SELECT email FROM users WHERE id = :id', { id: req.user.id });
      await query(
        'UPDATE bookings SET status = :status WHERE id = :id AND vendor_email = :email',
        { id, status, email: userRows[0]?.email },
      );
    } else {
      await query(
        'UPDATE bookings SET status = :status WHERE id = :id AND couple_user_id = :userId',
        { id, status, userId: req.user.id },
      );
    }

    const rows = await query('SELECT * FROM bookings WHERE id = :id', { id });
    if (!rows.length) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    res.json({ booking: bookingFromRow(rows[0]) });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Could not update booking.' });
  }
});

module.exports = router;
