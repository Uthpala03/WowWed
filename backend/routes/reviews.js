const express = require('express');
const { query } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { isPaid } = require('../utils/bookingStatus');

const router = express.Router();

function reviewFromRow(row) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    coupleUserId: row.couple_user_id,
    vendorListingId: row.vendor_listing_id || '',
    vendorUserId: row.vendor_user_id || null,
    vendorName: row.vendor_name || '',
    coupleName: row.couple_name || '',
    rating: Number(row.rating) || 0,
    comment: row.comment || '',
    createdAt: row.created_at,
  };
}

async function refreshListingRating(listingId) {
  if (!listingId) return;
  const rows = await query(
    'SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count FROM vendor_reviews WHERE vendor_listing_id = :listingId',
    { listingId },
  );
  const avg = Number(rows[0]?.avg_rating);
  if (!avg) return;
  await query(
    'UPDATE vendor_listings SET rating = :rating WHERE id = :id',
    { rating: Math.round(avg * 10) / 10, id: listingId },
  );
}

router.get('/', authRequired, async (req, res) => {
  try {
    let rows;
    if (req.query.listingId) {
      rows = await query(
        'SELECT * FROM vendor_reviews WHERE vendor_listing_id = :listingId ORDER BY created_at DESC',
        { listingId: req.query.listingId },
      );
    } else if (req.user.role === 'vendor') {
      rows = await query(
        `SELECT * FROM vendor_reviews
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
        'SELECT * FROM vendor_reviews WHERE couple_user_id = :userId ORDER BY created_at DESC',
        { userId: req.user.id },
      );
    }
    res.json({ reviews: rows.map(reviewFromRow) });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Could not load reviews.' });
  }
});

router.post('/', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'couple') {
      res.status(403).json({ error: 'Only couples can leave reviews.' });
      return;
    }

    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();
    const bookingId = req.body.bookingId;
    if (!bookingId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'A booking and a 1–5 star rating are required.' });
      return;
    }

    const bookings = await query('SELECT * FROM bookings WHERE id = :id', { id: bookingId });
    const booking = bookings[0];
    if (!booking || Number(booking.couple_user_id) !== Number(req.user.id)) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    if (!isPaid(booking.status)) {
      res.status(400).json({ error: 'You can review a vendor after the booking is paid.' });
      return;
    }

    const existing = await query(
      'SELECT id FROM vendor_reviews WHERE booking_id = :bookingId',
      { bookingId },
    );
    if (existing.length) {
      res.status(400).json({ error: 'You already reviewed this booking.' });
      return;
    }

    await query(
      `INSERT INTO vendor_reviews
       (booking_id, couple_user_id, vendor_listing_id, vendor_user_id, vendor_name, couple_name, rating, comment)
       VALUES (:bookingId, :coupleUserId, :listingId, :vendorUserId, :vendorName, :coupleName, :rating, :comment)`,
      {
        bookingId,
        coupleUserId: req.user.id,
        listingId: booking.vendor_listing_id || null,
        vendorUserId: booking.vendor_user_id || null,
        vendorName: booking.vendor_name || '',
        coupleName: booking.couple_name || '',
        rating: Math.round(rating),
        comment,
      },
    );

    await refreshListingRating(booking.vendor_listing_id);

    const rows = await query('SELECT * FROM vendor_reviews WHERE booking_id = :bookingId', { bookingId });
    res.status(201).json({ review: reviewFromRow(rows[0]) });
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Could not save this review.' });
  }
});

module.exports = router;
