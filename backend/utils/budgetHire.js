const { query } = require('../config/db');

const CATEGORY_COLORS = ['#e8a88c', '#7a9eb8', '#b8a0c8', '#d4b85c', '#c96a5a', '#6b9e78', '#5c6d8a', '#8a7268'];

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function applyHiredVendorToBudget(coupleUserId, booking) {
  const rows = await query(
    "SELECT data_json FROM user_data WHERE user_id = :userId AND store_key = 'budget'",
    { userId: coupleUserId },
  );
  const profileRows = await query(
    'SELECT budget FROM wedding_profiles WHERE user_id = :userId',
    { userId: coupleUserId },
  );

  const current = parseJson(rows[0]?.data_json, null);
  const budget = {
    total: Number(current?.total) || Number(profileRows[0]?.budget) || 0,
    categories: Array.isArray(current?.categories) ? [...current.categories] : [],
    expenses: Array.isArray(current?.expenses) ? [...current.expenses] : [],
  };

  const amount = Number(booking.amount) || 0;
  const vendorName = booking.vendorName || booking.vendor_name || 'Hired vendor';
  const categoryName = booking.category || 'Vendors';
  const expenseId = `hire-${booking.id}`;

  if (budget.expenses.some((item) => item.id === expenseId || item.bookingId === booking.id)) {
    return budget;
  }

  let category = budget.categories.find(
    (item) => String(item.name).toLowerCase() === String(categoryName).toLowerCase(),
  );
  if (!category) {
    category = {
      id: `c-hire-${Date.now()}`,
      name: categoryName,
      allocated: amount,
      color: CATEGORY_COLORS[budget.categories.length % CATEGORY_COLORS.length],
    };
    budget.categories.push(category);
  } else {
    category.allocated = Number(category.allocated || 0) + amount;
  }

  budget.expenses.push({
    id: expenseId,
    bookingId: booking.id,
    name: vendorName,
    amount,
    categoryId: category.id,
    date: new Date().toISOString().slice(0, 10),
    notes: 'Hired via WowWed marketplace',
    hired: true,
  });

  await query(
    `INSERT INTO user_data (user_id, store_key, data_json)
     VALUES (:userId, 'budget', :data)
     ON DUPLICATE KEY UPDATE data_json = :data, updated_at = NOW()`,
    { userId: coupleUserId, data: JSON.stringify(budget) },
  );

  return budget;
}

module.exports = { applyHiredVendorToBudget };
