const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { defaultTasks, defaultGuests, defaultBudget, defaultSeating } = require('../data/defaultData');
const { applyOnboardingToWeddingProfile } = require('../utils/onboardingWedding');
const { applyChecklistForCouple } = require('../utils/coupleChecklist');

const router = express.Router();

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone || '',
    role: row.role,
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'wowwed_dev_secret',
    { expiresIn: '7d' },
  );
}

async function seedCoupleData(userId) {
  const items = [
    { key: 'tasks', data: defaultTasks },
    { key: 'guests', data: defaultGuests },
    { key: 'budget', data: defaultBudget },
    { key: 'seating', data: defaultSeating },
    { key: 'crew', data: [] },
    { key: 'invitation', data: null },
  ];

  for (const item of items) {
    await query(
      'INSERT IGNORE INTO user_data (user_id, store_key, data_json) VALUES (:userId, :key, :data)',
      { userId, key: item.key, data: JSON.stringify(item.data) },
    );
  }
}

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, role = 'couple', onboarding } = req.body;

    if (!fullName?.trim() || !email?.trim() || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await query('SELECT id FROM users WHERE email = :email', { email: normalizedEmail });
    if (existing.length) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (:fullName, :email, :phone, :passwordHash, :role)',
      { fullName: fullName.trim(), email: normalizedEmail, phone: phone?.trim() || null, passwordHash, role },
    );

    const userId = result.insertId;

    if (onboarding) {
      await query(
        'INSERT INTO onboarding (user_id, data_json, completed_at) VALUES (:userId, :data, :completedAt)',
        { userId, data: JSON.stringify(onboarding), completedAt: onboarding.completedAt || new Date() },
      );
    }

    if (role === 'couple') {
      await seedCoupleData(userId);
      if (onboarding) {
        await applyOnboardingToWeddingProfile(userId, onboarding);
      }
      await applyChecklistForCouple(userId, []);
    }

    const rows = await query('SELECT * FROM users WHERE id = :id', { id: userId });
    const user = toUser(rows[0]);
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Could not create account. Check database connection.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    let normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      normalizedEmail = `${normalizedEmail}@vendors.wowwed.lk`;
    }
    const rows = await query('SELECT * FROM users WHERE email = :email', { email: normalizedEmail });
    if (!rows.length) {
      res.status(401).json({ error: 'Email not found. Check your details or create an account.' });
      return;
    }

    const row = rows[0];
    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Incorrect password. Try again or reset your password.' });
      return;
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = :id', { id: row.id });
    const user = toUser({ ...row, last_login: new Date() });
    const token = signToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Check database connection.' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM users WHERE id = :id', { id: req.user.id });
    if (!rows.length) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({ user: toUser(rows[0]) });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Could not load user.' });
  }
});

router.put('/password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password || password.length < 6) {
      res.status(400).json({ error: 'Valid email and password (6+ chars) required.' });
      return;
    }

    const rows = await query('SELECT id FROM users WHERE email = :email', { email: email.trim().toLowerCase() });
    if (!rows.length) {
      res.status(404).json({ error: 'Email not found.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash = :passwordHash WHERE id = :id', {
      id: rows[0].id,
      passwordHash,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Could not update password.' });
  }
});

module.exports = router;
