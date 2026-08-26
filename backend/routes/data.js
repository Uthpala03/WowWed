const express = require('express');
const { query } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { isSharedDemoBudget, isSharedDemoGuestList, isSharedDemoTaskList } = require('../data/defaultData');
const { applyChecklistForCouple } = require('../utils/coupleChecklist');

const router = express.Router();

const ALLOWED_KEYS = ['tasks', 'guests', 'budget', 'seating', 'crew', 'invitation'];

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

router.get('/', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await query(
      'SELECT store_key, data_json FROM user_data WHERE user_id = :userId',
      { userId },
    );

    const data = {
      tasks: null,
      guests: [],
      budget: null,
      seating: { tables: [], assignments: {} },
      crew: [],
      invitation: null,
    };

    rows.forEach((row) => {
      data[row.store_key] = parseJson(row.data_json, data[row.store_key]);
    });

    if (isSharedDemoGuestList(data.guests)) {
      data.guests = [];
      await query(
        `INSERT INTO user_data (user_id, store_key, data_json)
         VALUES (:userId, 'guests', :data)
         ON DUPLICATE KEY UPDATE data_json = :data, updated_at = NOW()`,
        { userId, data: JSON.stringify([]) },
      );
    }

    if (isSharedDemoTaskList(data.tasks)) {
      data.tasks = [];
      await query(
        `INSERT INTO user_data (user_id, store_key, data_json)
         VALUES (:userId, 'tasks', :data)
         ON DUPLICATE KEY UPDATE data_json = :data, updated_at = NOW()`,
        { userId, data: JSON.stringify([]) },
      );
    }

    data.tasks = await applyChecklistForCouple(userId, data.tasks || []);

    if (isSharedDemoBudget(data.budget)) {
      const profileRows = await query(
        'SELECT budget FROM wedding_profiles WHERE user_id = :userId',
        { userId },
      );
      data.budget = {
        total: Number(profileRows[0]?.budget) || 0,
        categories: [],
        expenses: [],
      };
      await query(
        `INSERT INTO user_data (user_id, store_key, data_json)
         VALUES (:userId, 'budget', :data)
         ON DUPLICATE KEY UPDATE data_json = :data, updated_at = NOW()`,
        { userId, data: JSON.stringify(data.budget) },
      );
    } else if (req.user.role === 'couple') {
      const profileRows = await query(
        'SELECT budget FROM wedding_profiles WHERE user_id = :userId',
        { userId },
      );
      const profileBudget = Number(profileRows[0]?.budget) || 0;
      if (profileBudget) {
        const current = data.budget && typeof data.budget === 'object'
          ? data.budget
          : { categories: [], expenses: [] };
        if (Number(current.total) !== profileBudget) {
          data.budget = {
            ...current,
            total: profileBudget,
            categories: current.categories || [],
            expenses: current.expenses || [],
          };
          await query(
            `INSERT INTO user_data (user_id, store_key, data_json)
             VALUES (:userId, 'budget', :data)
             ON DUPLICATE KEY UPDATE data_json = :data, updated_at = NOW()`,
            { userId, data: JSON.stringify(data.budget) },
          );
        }
      }
    }

    if (req.user.role === 'couple') {
      try {
        const { applyHiredVendorToBudget } = require('../utils/budgetHire');
        const hiredRows = await query(
          "SELECT * FROM bookings WHERE couple_user_id = :userId AND status IN ('Hired', 'Confirmed')",
          { userId },
        );
        for (const row of hiredRows) {
          data.budget = await applyHiredVendorToBudget(userId, {
            id: row.id,
            vendorName: row.vendor_name,
            category: row.category,
            amount: row.amount,
          });
        }
      } catch (hireErr) {
        console.error('Hired vendor budget sync skipped:', hireErr.message);
      }
    }

    res.json(data);
  } catch (err) {
    console.error('Get data error:', err);
    res.status(500).json({ error: 'Could not load data.' });
  }
});

router.get('/:key', authRequired, async (req, res) => {
  try {
    const { key } = req.params;
    if (!ALLOWED_KEYS.includes(key)) {
      res.status(400).json({ error: 'Invalid data key.' });
      return;
    }

    const rows = await query(
      'SELECT data_json FROM user_data WHERE user_id = :userId AND store_key = :key',
      { userId: req.user.id, key },
    );

    if (!rows.length) {
      res.json({ data: null });
      return;
    }

    res.json({ data: parseJson(rows[0].data_json, null) });
  } catch (err) {
    console.error('Get data key error:', err);
    res.status(500).json({ error: 'Could not load data.' });
  }
});

router.put('/:key', authRequired, async (req, res) => {
  try {
    const { key } = req.params;
    if (!ALLOWED_KEYS.includes(key)) {
      res.status(400).json({ error: 'Invalid data key.' });
      return;
    }

    const data = req.body;
    await query(
      `INSERT INTO user_data (user_id, store_key, data_json)
       VALUES (:userId, :key, :data)
       ON DUPLICATE KEY UPDATE data_json = :data, updated_at = NOW()`,
      { userId: req.user.id, key, data: JSON.stringify(data) },
    );

    if (key === 'budget' && data && data.total != null) {
      await query(
        `UPDATE wedding_profiles
         SET budget = :budget, updated_at = NOW()
         WHERE user_id = :userId`,
        { userId: req.user.id, budget: Number(data.total) || null },
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Save data error:', err);
    res.status(500).json({ error: 'Could not save data.' });
  }
});

module.exports = router;
