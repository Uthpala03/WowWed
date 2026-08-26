const { query } = require('../config/db');

async function createNotification({
  userId,
  type = 'info',
  title,
  message = '',
  link = null,
  bookingId = null,
}) {
  if (!userId || !title) return null;
  await query(
    `INSERT INTO notifications (user_id, type, title, message, link, booking_id)
     VALUES (:userId, :type, :title, :message, :link, :bookingId)`,
    {
      userId,
      type,
      title,
      message,
      link,
      bookingId,
    },
  );
  return true;
}

module.exports = { createNotification };
