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

function weddingFromRow(row) {
  if (!row) return null;
  return {
    partnerOne: row.partner_one || '',
    partnerTwo: row.partner_two || '',
    weddingDate: formatDateValue(row.wedding_date),
    venue: row.venue || '',
    district: row.district || 'Colombo',
    ceremonyType: row.ceremony_type || 'Poruwa',
    guestCount: row.guest_count || 150,
    budget: row.budget ? Number(row.budget) : '',
    scale: row.scale || 'standard',
    venueType: row.venue_type || '',
    planningStage: row.planning_stage || '',
    updatedAt: row.updated_at,
    ownerEmail: row.email || null,
  };
}

function vendorFromRow(row) {
  if (!row) return null;
  return {
    id: row.user_id ? `vp-${row.user_id}` : row.id,
    businessName: row.business_name,
    category: row.category,
    district: row.district,
    priceRange: row.price_range,
    description: row.description || '',
    rating: Number(row.rating) || 4.5,
    ownerEmail: row.email || row.owner_email,
  };
}

router.get('/wedding', authRequired, async (req, res) => {
  try {
    const rows = await query(
      `SELECT wp.*, u.email FROM wedding_profiles wp
       JOIN users u ON u.id = wp.user_id
       WHERE wp.user_id = :userId`,
      { userId: req.user.id },
    );
    res.json({ profile: weddingFromRow(rows[0]) });
  } catch (err) {
    console.error('Get wedding profile error:', err);
    res.status(500).json({ error: 'Could not load wedding profile.' });
  }
});

router.put('/wedding', authRequired, async (req, res) => {
  try {
    const p = req.body;
    await query(
      `INSERT INTO wedding_profiles
       (user_id, partner_one, partner_two, wedding_date, venue, district, ceremony_type, guest_count, budget, scale, venue_type, planning_stage)
       VALUES (:userId, :partnerOne, :partnerTwo, :weddingDate, :venue, :district, :ceremonyType, :guestCount, :budget, :scale, :venueType, :planningStage)
       ON DUPLICATE KEY UPDATE
         partner_one = :partnerOne, partner_two = :partnerTwo, wedding_date = :weddingDate,
         venue = :venue, district = :district, ceremony_type = :ceremonyType,
         guest_count = :guestCount, budget = :budget, scale = :scale,
         venue_type = :venueType, planning_stage = :planningStage, updated_at = NOW()`,
      {
        userId: req.user.id,
        partnerOne: p.partnerOne,
        partnerTwo: p.partnerTwo,
        weddingDate: p.weddingDate || null,
        venue: p.venue,
        district: p.district,
        ceremonyType: p.ceremonyType,
        guestCount: Number(p.guestCount) || null,
        budget: Number(p.budget) || null,
        scale: p.scale,
        venueType: p.venueType || null,
        planningStage: p.planningStage || null,
      },
    );

    const rows = await query(
      `SELECT wp.*, u.email FROM wedding_profiles wp
       JOIN users u ON u.id = wp.user_id WHERE wp.user_id = :userId`,
      { userId: req.user.id },
    );
    res.json({ profile: weddingFromRow(rows[0]) });
  } catch (err) {
    console.error('Save wedding profile error:', err);
    res.status(500).json({ error: 'Could not save wedding profile.' });
  }
});

router.get('/onboarding', authRequired, async (req, res) => {
  try {
    const rows = await query('SELECT data_json, completed_at FROM onboarding WHERE user_id = :userId', {
      userId: req.user.id,
    });
    if (!rows.length) {
      res.json({ onboarding: null });
      return;
    }
    const data = typeof rows[0].data_json === 'object' ? rows[0].data_json : JSON.parse(rows[0].data_json);
    res.json({ onboarding: { ...data, completedAt: rows[0].completed_at } });
  } catch (err) {
    console.error('Get onboarding error:', err);
    res.status(500).json({ error: 'Could not load onboarding.' });
  }
});

router.get('/vendor', authRequired, async (req, res) => {
  try {
    const rows = await query(
      `SELECT vp.*, u.email FROM vendor_profiles vp
       JOIN users u ON u.id = vp.user_id
       WHERE vp.user_id = :userId`,
      { userId: req.user.id },
    );
    res.json({ profile: vendorFromRow(rows[0]) });
  } catch (err) {
    console.error('Get vendor profile error:', err);
    res.status(500).json({ error: 'Could not load vendor profile.' });
  }
});

router.put('/vendor', authRequired, async (req, res) => {
  try {
    const p = req.body;
    const userId = req.user.id;

    await query(
      `INSERT INTO vendor_profiles (user_id, business_name, category, district, price_range, description, rating)
       VALUES (:userId, :businessName, :category, :district, :priceRange, :description, :rating)
       ON DUPLICATE KEY UPDATE
         business_name = :businessName, category = :category, district = :district,
         price_range = :priceRange, description = :description, rating = :rating, updated_at = NOW()`,
      {
        userId,
        businessName: p.businessName,
        category: p.category,
        district: p.district,
        priceRange: p.priceRange,
        description: p.description || '',
        rating: Number(p.rating) || 4.5,
      },
    );

    const listingId = p.id || `vp-${userId}`;
    await query(
      `INSERT INTO vendor_listings
       (id, user_id, name, category, city, district, price_range, description, rating, owner_email)
       VALUES (:id, :userId, :name, :category, :city, :district, :priceRange, :description, :rating, :ownerEmail)
       ON DUPLICATE KEY UPDATE
         user_id = :userId, name = :name, category = :category, city = :city, district = :district,
         price_range = :priceRange, description = :description, rating = :rating, owner_email = :ownerEmail`,
      {
        id: listingId,
        userId,
        name: p.businessName,
        category: p.category,
        city: p.district,
        district: p.district,
        priceRange: p.priceRange,
        description: p.description || '',
        rating: Number(p.rating) || 4.5,
        ownerEmail: p.ownerEmail,
      },
    );

    const rows = await query(
      `SELECT vp.*, u.email FROM vendor_profiles vp
       JOIN users u ON u.id = vp.user_id WHERE vp.user_id = :userId`,
      { userId },
    );
    res.json({ profile: vendorFromRow(rows[0]) });
  } catch (err) {
    console.error('Save vendor profile error:', err);
    res.status(500).json({ error: 'Could not save vendor profile.' });
  }
});

router.get('/vendors', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM vendor_listings ORDER BY spotlight DESC, name ASC');
    const listings = rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      city: row.city,
      district: row.district,
      priceRange: row.price_range,
      description: row.description || '',
      rating: Number(row.rating) || 4.5,
      ownerEmail: row.owner_email,
      spotlight: Boolean(row.spotlight),
    }));
    res.json({ listings });
  } catch (err) {
    console.error('Get vendor listings error:', err);
    res.status(500).json({ error: 'Could not load vendors.' });
  }
});

module.exports = router;
