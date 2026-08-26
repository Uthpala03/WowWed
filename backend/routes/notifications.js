const express = require('express');
const { query } = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function notificationFromRow(row) {
  return {
    id: `n-${row.id}`,
    dbId: row.id,
    type: row.type || 'info',
    title: row.title,
    text: row.message || row.title,
    message: row.message || row.title,
    link: row.link || (row.booking_id ? '/dashboard/bookings' : '/dashboard'),
    bookingId: row.booking_id || null,
    read: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

router.get('/', authRequired, async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM notifications WHERE user_id = :userId ORDER BY created_at DESC LIMIT 50',
      { userId: req.user.id },
    );
    const notifications = rows.map(notificationFromRow);
    res.json({
      notifications,
      unread: notifications.filter((item) => !item.read).length,
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Could not load notifications.' });
  }
});

router.put('/read-all', authRequired, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = :userId AND is_read = 0',
      { userId: req.user.id },
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Mark notifications read error:', err);
    res.status(500).json({ error: 'Could not update notifications.' });
  }
});

router.put('/:id/read', authRequired, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :userId',
      { id: req.params.id, userId: req.user.id },
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Could not update notification.' });
  }
});

module.exports = router;
