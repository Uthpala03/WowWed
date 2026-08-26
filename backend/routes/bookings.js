const express = require('express');
const { query } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');
const { applyHiredVendorToBudget } = require('../utils/budgetHire');
const {
  canonicalizeStatus,
  isPaid,
  coupleCanHire,
  coupleCanCancel,
} = require('../utils/bookingStatus');

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
    coupleUserId: row.couple_user_id,
    vendorListingId: row.vendor_listing_id || '',
    vendorUserId: row.vendor_user_id || null,
    vendorName: row.vendor_name,
    vendorEmail: row.vendor_email || '',
    category: row.category || '',
    coupleName: row.couple_name,
    coupleEmail: row.couple_email,
    date: formatDateValue(row.booking_date),
    amount: row.amount ? Number(row.amount) : 0,
    message: row.message || '',
    vendorNote: row.vendor_note || '',
    coupleNote: row.couple_note || '',
    status: canonicalizeStatus(row.status) || row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadBooking(id) {
  const rows = await query('SELECT * FROM bookings WHERE id = :id', { id });
  return rows[0] ? bookingFromRow(rows[0]) : null;
}

async function vendorOwnsBooking(userId, booking) {
  if (booking.vendorListingId) {
    const rows = await query(
      'SELECT id FROM vendor_listings WHERE id = :id AND user_id = :userId',
      { id: booking.vendorListingId, userId },
    );
    return rows.length > 0;
  }
  return Boolean(booking.vendorUserId && Number(booking.vendorUserId) === Number(userId));
}

async function findBusyBookings(listingId, date, excludeId = '') {
  if (!listingId || !date) return [];
  const sql = `SELECT id, status, couple_name, booking_date
     FROM bookings
     WHERE vendor_listing_id = :listingId
       AND booking_date = :date
       AND status IN ('Confirmed', 'Accepted', 'Paid', 'Hired', 'Negotiating', 'Updated', 'Countered')
       ${excludeId ? 'AND id != :excludeId' : ''}`;
  const params = excludeId ? { listingId, date, excludeId } : { listingId, date };
  return query(sql, params);
}

router.get('/', authRequired, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'vendor') {
      rows = await query(
        `SELECT * FROM bookings
         WHERE vendor_listing_id IN (SELECT id FROM vendor_listings WHERE user_id = :userId)
            OR (
              (vendor_listing_id IS NULL OR vendor_listing_id = '')
              AND vendor_user_id = :userId
            )
         ORDER BY created_at DESC`,
        { userId: req.user.id },
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

router.get('/availability', authRequired, async (req, res) => {
  try {
    const listingId = req.query.listingId || '';
    const date = req.query.date || '';
    if (!listingId || !date) {
      res.status(400).json({ error: 'listingId and date are required.' });
      return;
    }
    const busy = await findBusyBookings(listingId, date);
    res.json({
      available: busy.length === 0,
      date,
      listingId,
      bookings: busy.map((row) => ({
        id: row.id,
        status: row.status,
        coupleName: row.couple_name,
      })),
    });
  } catch (err) {
    console.error('Availability error:', err);
    res.status(500).json({ error: 'Could not check availability.' });
  }
});

router.post('/', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'couple') {
      res.status(403).json({ error: 'Only couples can create bookings.' });
      return;
    }

    const b = req.body;
    let listingId = String(b.vendorListingId || b.vendorId || '').trim();
    let listing = null;
    if (listingId) {
      const listingRows = await query('SELECT * FROM vendor_listings WHERE id = :id', { id: listingId });
      listing = listingRows[0] || null;
      if (!listing) {
        res.status(400).json({ error: 'That vendor listing was not found. Open the vendor card and send again.' });
        return;
      }
    } else if (b.vendorName) {
      const byName = await query(
        'SELECT * FROM vendor_listings WHERE LOWER(name) = LOWER(:name) ORDER BY id LIMIT 2',
        { name: b.vendorName },
      );
      if (byName.length === 1) listing = byName[0];
    }
    if (!listing) {
      res.status(400).json({ error: 'This request is not tied to a vendor listing. Open the vendor card and send again.' });
      return;
    }
    listingId = listing.id;

    let vendorUserId = listing.user_id || null;
    let vendorEmail = '';
    if (vendorUserId) {
      const vendorUser = await query('SELECT email FROM users WHERE id = :id', { id: vendorUserId });
      vendorEmail = vendorUser[0]?.email || '';
    }
    if (!vendorEmail) vendorEmail = listing.owner_email || '';

    if (listingId && b.date) {
      const busy = await findBusyBookings(listingId, b.date);
      if (busy.length) {
        res.status(409).json({
          error: 'This vendor is already booked on that date. Please choose another date.',
          available: false,
        });
        return;
      }
    }

    const id = b.id || `bk${Date.now()}`;
    const vendorName = listing?.name || b.vendorName;
    const category = b.category || listing?.category || '';

    await query(
      `INSERT INTO bookings
       (id, couple_user_id, vendor_listing_id, vendor_user_id, vendor_name, vendor_email, category,
        couple_name, couple_email, booking_date, amount, message, status)
       VALUES (:id, :coupleUserId, :listingId, :vendorUserId, :vendorName, :vendorEmail, :category,
        :coupleName, :coupleEmail, :date, :amount, :message, :status)`,
      {
        id,
        coupleUserId: req.user.id,
        listingId,
        vendorUserId,
        vendorName,
        vendorEmail: vendorEmail || null,
        category,
        coupleName: b.coupleName,
        coupleEmail: b.coupleEmail,
        date: b.date || null,
        amount: Number(b.amount) || 0,
        message: b.message || '',
        status: 'Pending',
      },
    );

    if (vendorUserId) {
      await createNotification({
        userId: vendorUserId,
        type: 'info',
        title: 'New booking request',
        message: `${b.coupleName || 'A couple'} requested ${vendorName} for Rs. ${Number(b.amount || 0).toLocaleString()}.`,
        link: '/vendor/bookings',
        bookingId: id,
      });
    }

    res.status(201).json({ booking: await loadBooking(id) });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Could not create booking.' });
  }
});

router.put('/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await loadBooking(id);
    if (!existing) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    const requestedStatus = req.body.status || existing.status;
    const nextStatus = canonicalizeStatus(requestedStatus);
    const nextAmount = req.body.amount != null ? Number(req.body.amount) : existing.amount;
    const vendorNote = req.body.vendorNote != null ? req.body.vendorNote : existing.vendorNote;
    const coupleNote = req.body.coupleNote != null ? req.body.coupleNote : existing.coupleNote;

    if (req.user.role === 'vendor') {
      const allowed = await vendorOwnsBooking(req.user.id, existing);
      if (!allowed) {
        res.status(403).json({ error: 'This request is not for your listing.' });
        return;
      }
      if (isPaid(existing.status)) {
        res.status(400).json({ error: 'This booking is already paid and cannot be changed.' });
        return;
      }
      if (!['Confirmed', 'Rejected', 'Negotiating'].includes(nextStatus)) {
        res.status(400).json({ error: 'Vendors can accept, reject, or send a counter-offer.' });
        return;
      }

      if (nextStatus === 'Confirmed' && existing.date) {
        const busy = await findBusyBookings(existing.vendorListingId, existing.date, existing.id);
        if (busy.length) {
          res.status(400).json({ error: 'You already have a confirmed booking on this date.' });
          return;
        }
      }

      await query(
        `UPDATE bookings
         SET status = :status, amount = :amount, vendor_note = :vendorNote
         WHERE id = :id`,
        { id, status: nextStatus, amount: nextAmount, vendorNote },
      );

      const statusText = nextStatus === 'Confirmed'
        ? 'accepted your request'
        : nextStatus === 'Rejected'
          ? 'declined your request'
          : 'sent a counter-offer on your request';
      await createNotification({
        userId: existing.coupleUserId,
        type: nextStatus === 'Rejected' ? 'warning' : nextStatus === 'Confirmed' ? 'warning' : 'info',
        title: nextStatus === 'Confirmed'
          ? `${existing.vendorName} accepted — ready to hire`
          : `${existing.vendorName} ${statusText}`,
        message: vendorNote
          ? vendorNote
          : nextStatus === 'Negotiating'
            ? `Updated quote: Rs. ${Number(nextAmount || 0).toLocaleString()}. Confirm when you are ready to hire.`
            : nextStatus === 'Confirmed'
              ? 'Confirm the booking to add it to your budget.'
              : `${existing.vendorName} ${statusText}.`,
        link: '/dashboard/bookings',
        bookingId: id,
      });
    } else {
      if (Number(existing.coupleUserId) !== Number(req.user.id)
        && existing.coupleEmail !== req.user.email) {
        const rows = await query(
          'SELECT couple_user_id FROM bookings WHERE id = :id AND couple_user_id = :userId',
          { id, userId: req.user.id },
        );
        if (!rows.length) {
          res.status(403).json({ error: 'This booking does not belong to you.' });
          return;
        }
      }

      if (nextStatus === 'Paid') {
        if (!coupleCanHire(existing.status)) {
          res.status(400).json({ error: 'You can confirm this booking after the vendor accepts or sends a counter-offer.' });
          return;
        }
        await query(
          'UPDATE bookings SET status = :status, couple_note = :coupleNote WHERE id = :id AND couple_user_id = :userId',
          { id, status: 'Paid', coupleNote, userId: req.user.id },
        );
        const hired = await loadBooking(id);
        await applyHiredVendorToBudget(req.user.id, hired);
        if (hired.vendorUserId) {
          await createNotification({
            userId: hired.vendorUserId,
            type: 'info',
            title: 'Couple confirmed your booking',
            message: `${hired.coupleName || 'The couple'} booked ${hired.vendorName} for Rs. ${Number(hired.amount || 0).toLocaleString()}.`,
            link: '/vendor/bookings',
            bookingId: id,
          });
        }
      } else if (nextStatus === 'Confirmed') {
        if (canonicalizeStatus(existing.status) !== 'Negotiating' && canonicalizeStatus(existing.status) !== 'Confirmed') {
          res.status(400).json({ error: 'You can accept this offer after the vendor sends a counter-offer.' });
          return;
        }
        await query(
          'UPDATE bookings SET status = :status, couple_note = :coupleNote WHERE id = :id AND couple_user_id = :userId',
          { id, status: 'Confirmed', coupleNote, userId: req.user.id },
        );
        if (existing.vendorUserId) {
          await createNotification({
            userId: existing.vendorUserId,
            type: 'info',
            title: 'Couple accepted your offer',
            message: `${existing.coupleName || 'The couple'} accepted Rs. ${Number(existing.amount || 0).toLocaleString()} for ${existing.vendorName}.`,
            link: '/vendor/bookings',
            bookingId: id,
          });
        }
      } else if (nextStatus === 'Countered') {
        if (isPaid(existing.status) || existing.status === 'Rejected' || existing.status === 'Cancelled') {
          res.status(400).json({ error: 'This booking can no longer be negotiated.' });
          return;
        }
        await query(
          `UPDATE bookings
           SET status = :status, amount = :amount, couple_note = :coupleNote
           WHERE id = :id AND couple_user_id = :userId`,
          {
            id,
            status: 'Countered',
            amount: nextAmount,
            coupleNote,
            userId: req.user.id,
          },
        );
        if (existing.vendorUserId) {
          await createNotification({
            userId: existing.vendorUserId,
            type: 'info',
            title: 'Couple sent a negotiation reply',
            message: coupleNote
              ? coupleNote
              : `${existing.coupleName || 'The couple'} offered Rs. ${Number(nextAmount || 0).toLocaleString()} for ${existing.vendorName}.`,
            link: '/vendor/bookings',
            bookingId: id,
          });
        }
      } else if (nextStatus === 'Cancelled') {
        if (!coupleCanCancel(existing.status)) {
          res.status(400).json({ error: 'Paid bookings cannot be cancelled here.' });
          return;
        }
        await query(
          'UPDATE bookings SET status = :status, couple_note = :coupleNote WHERE id = :id AND couple_user_id = :userId',
          { id, status: 'Cancelled', coupleNote, userId: req.user.id },
        );
        if (existing.vendorUserId) {
          await createNotification({
            userId: existing.vendorUserId,
            type: 'warning',
            title: 'Booking cancelled',
            message: `${existing.coupleName || 'A couple'} cancelled ${existing.vendorName}.`,
            link: '/vendor/bookings',
            bookingId: id,
          });
        }
      } else {
        res.status(400).json({ error: 'You can confirm, cancel, accept an offer, or send a negotiation reply.' });
        return;
      }
    }

    res.json({ booking: await loadBooking(id) });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Could not update booking.' });
  }
});

module.exports = router;
