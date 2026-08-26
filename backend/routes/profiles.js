const express = require('express');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const {
  applyOnboardingToWeddingProfile,
  loadOnboarding,
  saveOnboardingRow,
} = require('../utils/onboardingWedding');
const { applyChecklistForCouple } = require('../utils/coupleChecklist');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '../uploads/vendors');

function formatDateValue(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (Number.isNaN(value.getTime())) return '';
  return value.toISOString().slice(0, 10);
}

function weddingFromRow(row) {
  if (!row) return null;
  return {
    partnerOne: row.partner_one || '',
    partnerTwo: row.partner_two || '',
    weddingDate: formatDateValue(row.wedding_date),
    venue: row.venue || '',
    district: row.district || '',
    ceremonyType: row.ceremony_type || '',
    guestCount: row.guest_count || 150,
    budget: row.budget ? Number(row.budget) : '',
    scale: row.scale || 'standard',
    venueType: row.venue_type || '',
    planningStage: row.planning_stage || '',
    updatedAt: row.updated_at,
    ownerEmail: row.email || null,
  };
}

function parsePortfolioJson(raw) {
  if (!raw) {
    return {
      images: [], quotations: [], quotationPdf: null, categories: [], districts: [],
      locations: [], phone: '', email: '', website: '', address: '',
    };
  }
  const data = typeof raw === 'object' ? raw : JSON.parse(raw);
  return {
    images: Array.isArray(data.images) ? data.images : [],
    quotations: Array.isArray(data.quotations) ? data.quotations : [],
    quotationPdf: data.quotationPdf || null,
    categories: Array.isArray(data.categories) ? data.categories : [],
    districts: Array.isArray(data.districts) ? data.districts : [],
    locations: Array.isArray(data.locations) ? data.locations : [],
    phone: data.phone || '',
    email: data.email || '',
    website: data.website || '',
    address: data.address || '',
  };
}

function serializePortfolio(portfolio) {
  return JSON.stringify({
    images: portfolio.images || [],
    quotations: (portfolio.quotations || []).map((q) => ({
      id: q.id,
      title: q.title || '',
      price: q.price || '',
      details: q.details || '',
      pdfName: q.pdfName || '',
      pdfUrl: q.pdfUrl || '',
    })),
    quotationPdf: portfolio.quotationPdf || null,
    categories: portfolio.categories || [],
    districts: portfolio.districts || [],
    locations: portfolio.locations || [],
    phone: portfolio.phone || '',
    email: portfolio.email || '',
    website: portfolio.website || '',
    address: portfolio.address || '',
  });
}

async function savePortfolioForVendor(userId, listingId, portfolio) {
  const portfolioJson = serializePortfolio(portfolio);
  await query(
    'UPDATE vendor_profiles SET portfolio_json = :portfolioJson, updated_at = NOW() WHERE user_id = :userId',
    { userId, portfolioJson },
  );
  await query(
    'UPDATE vendor_listings SET portfolio_json = :portfolioJson WHERE id = :listingId OR user_id = :userId',
    { userId, listingId, portfolioJson },
  );
}

function vendorFromRow(row) {
  if (!row) return null;
  const portfolio = parsePortfolioJson(row.portfolio_json);
  const categories = portfolio.categories.length
    ? portfolio.categories
    : (row.category ? [row.category] : []);
  const districts = portfolio.districts.length
    ? portfolio.districts
    : (row.district ? [row.district] : []);
  return {
    id: row.user_id ? `vp-${row.user_id}` : row.id,
    businessName: row.business_name,
    category: categories[0] || row.category,
    categories,
    district: districts[0] || row.district,
    districts,
    priceRange: row.price_range,
    description: row.description || '',
    rating: Number(row.rating) || 4.5,
    ownerEmail: row.email || row.owner_email,
    phone: portfolio.phone || '',
    website: portfolio.website || '',
    address: portfolio.address || '',
    locations: portfolio.locations,
    portfolioImages: portfolio.images,
    quotations: portfolio.quotations,
    quotationPdf: portfolio.quotationPdf,
  };
}

function listingFromRow(row) {
  const portfolio = parsePortfolioJson(row.portfolio_json);
  const categories = portfolio.categories.length
    ? portfolio.categories
    : (row.category ? [row.category] : []);
  const districts = portfolio.districts.length
    ? portfolio.districts
    : (row.district ? [row.district] : []);
  return {
    id: row.id,
    name: row.name,
    category: categories[0] || row.category,
    categories,
    city: row.city || districts[0] || '',
    district: districts[0] || row.district,
    districts,
    priceRange: row.price_range,
    description: row.description || '',
    rating: Number(row.rating) || 4.5,
    ownerEmail: row.owner_email || portfolio.email || '',
    phone: portfolio.phone || '',
    website: portfolio.website || '',
    address: portfolio.address || '',
    locations: portfolio.locations,
    spotlight: Boolean(row.spotlight),
    portfolioImages: portfolio.images,
    quotations: portfolio.quotations,
    quotationPdf: portfolio.quotationPdf,
  };
}

function portfolioPayload(p, existing = {}) {
  const categories = p.categories?.length
    ? p.categories
    : (p.category ? [p.category] : []);
  const districts = p.districts?.length
    ? p.districts
    : (p.district ? [p.district] : existing.districts || []);
  return serializePortfolio({
    images: p.portfolioImages || existing.images || [],
    quotations: (p.quotations || []).map((q) => ({
      id: q.id,
      title: q.title || '',
      price: q.price || '',
      details: q.details || '',
      pdfName: q.pdfName || '',
      pdfUrl: q.pdfUrl || '',
    })),
    quotationPdf: p.quotationPdf || existing.quotationPdf || null,
    categories,
    districts,
    locations: Array.isArray(p.locations) ? p.locations : (existing.locations || []),
    phone: p.phone || existing.phone || '',
    email: p.email || existing.email || '',
    website: p.website || existing.website || '',
    address: p.address || existing.address || '',
  });
}

function primaryCategory(p) {
  const list = p.categories?.length ? p.categories : (p.category ? [p.category] : []);
  return list[0] || p.category || null;
}

function primaryDistrict(p) {
  const list = p.districts?.length ? p.districts : (p.district ? [p.district] : []);
  return list[0] || p.district || null;
}

async function loadWeddingProfile(userId) {
  const rows = await query(
    `SELECT wp.*, u.email FROM wedding_profiles wp
     JOIN users u ON u.id = wp.user_id
     WHERE wp.user_id = :userId`,
    { userId },
  );
  return weddingFromRow(rows[0]);
}

router.get('/wedding', authRequired, async (req, res) => {
  try {
    if (req.user.role === 'couple') {
      const onboarding = await loadOnboarding(req.user.id);
      if (onboarding) {
        await applyOnboardingToWeddingProfile(req.user.id, onboarding);
      }
    }
    res.json({ profile: await loadWeddingProfile(req.user.id) });
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
         partner_one = :partnerOne, partner_two = :partnerTwo,
         wedding_date = COALESCE(:weddingDate, wedding_date),
         venue = COALESCE(NULLIF(:venue, ''), venue),
         district = COALESCE(NULLIF(:district, ''), district),
         ceremony_type = COALESCE(NULLIF(:ceremonyType, ''), ceremony_type),
         guest_count = :guestCount, budget = :budget, scale = :scale,
         venue_type = COALESCE(NULLIF(:venueType, ''), venue_type),
         planning_stage = COALESCE(NULLIF(:planningStage, ''), planning_stage),
         updated_at = NOW()`,
      {
        userId: req.user.id,
        partnerOne: p.partnerOne || null,
        partnerTwo: p.partnerTwo || null,
        weddingDate: p.weddingDate || null,
        venue: p.venue || null,
        district: p.district || null,
        ceremonyType: p.ceremonyType || null,
        guestCount: Number(p.guestCount) || null,
        budget: Number(p.budget) || null,
        scale: p.scale || null,
        venueType: p.venueType || null,
        planningStage: p.planningStage || null,
      },
    );

    const taskRows = await query(
      "SELECT data_json FROM user_data WHERE user_id = :userId AND store_key = 'tasks'",
      { userId: req.user.id },
    );
    const existingTasks = taskRows[0]?.data_json
      ? (typeof taskRows[0].data_json === 'object' ? taskRows[0].data_json : JSON.parse(taskRows[0].data_json))
      : [];
    await applyChecklistForCouple(req.user.id, existingTasks);

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
    res.json({ onboarding: await loadOnboarding(req.user.id) });
  } catch (err) {
    console.error('Get onboarding error:', err);
    res.status(500).json({ error: 'Could not load onboarding.' });
  }
});

router.put('/onboarding', authRequired, async (req, res) => {
  try {
    const onboarding = req.body || {};
    const saved = await saveOnboardingRow(req.user.id, onboarding);
    if (req.user.role === 'couple') {
      await applyOnboardingToWeddingProfile(req.user.id, saved, { overwrite: true });
    }
    res.json({
      onboarding: saved,
      profile: req.user.role === 'couple' ? await loadWeddingProfile(req.user.id) : null,
    });
  } catch (err) {
    console.error('Save onboarding error:', err);
    res.status(500).json({ error: 'Could not save onboarding.' });
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
    const existingRows = await query(
      'SELECT portfolio_json FROM vendor_profiles WHERE user_id = :userId',
      { userId },
    );
    const existing = parsePortfolioJson(existingRows[0]?.portfolio_json);
    const portfolioJson = portfolioPayload(p, existing);

    await query(
      `INSERT INTO vendor_profiles (user_id, business_name, category, district, price_range, description, portfolio_json, rating)
       VALUES (:userId, :businessName, :category, :district, :priceRange, :description, :portfolioJson, :rating)
       ON DUPLICATE KEY UPDATE
         business_name = :businessName, category = :category, district = :district,
         price_range = :priceRange, description = :description, portfolio_json = :portfolioJson,
         rating = :rating, updated_at = NOW()`,
      {
        userId,
        businessName: p.businessName,
        category: primaryCategory(p),
        district: primaryDistrict(p),
        priceRange: p.priceRange,
        description: p.description || '',
        portfolioJson,
        rating: Number(p.rating) || 4.5,
      },
    );

    const listingId = p.id || `vp-${userId}`;
    await query(
      `INSERT INTO vendor_listings
       (id, user_id, name, category, city, district, price_range, description, portfolio_json, rating, owner_email)
       VALUES (:id, :userId, :name, :category, :city, :district, :priceRange, :description, :portfolioJson, :rating, :ownerEmail)
       ON DUPLICATE KEY UPDATE
         user_id = :userId, name = :name, category = :category, city = :city, district = :district,
         price_range = :priceRange, description = :description, portfolio_json = :portfolioJson,
         rating = :rating, owner_email = :ownerEmail`,
      {
        id: listingId,
        userId,
        name: p.businessName,
        category: primaryCategory(p),
        city: primaryDistrict(p),
        district: primaryDistrict(p),
        priceRange: p.priceRange,
        description: p.description || '',
        portfolioJson,
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

router.post('/vendor/pdf', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      res.status(403).json({ error: 'Vendor access only.' });
      return;
    }

    const { dataUrl, fileName, quoteId, scope } = req.body;
    if (!dataUrl || !fileName) {
      res.status(400).json({ error: 'PDF file is required.' });
      return;
    }

    const base64 = String(dataUrl).replace(/^data:application\/pdf[^,]*,/, '');
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > 3 * 1024 * 1024) {
      res.status(400).json({ error: 'PDF must be under 3 MB.' });
      return;
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const safeName = `${req.user.id}-${quoteId || 'main'}-${Date.now()}.pdf`;
    fs.writeFileSync(path.join(UPLOAD_DIR, safeName), buffer);
    const url = `/uploads/vendors/${safeName}`;

    const userId = req.user.id;
    const listingId = `vp-${userId}`;
    const rows = await query(
      'SELECT portfolio_json FROM vendor_profiles WHERE user_id = :userId',
      { userId },
    );
    const portfolio = parsePortfolioJson(rows[0]?.portfolio_json);

    if (scope === 'main' || !quoteId) {
      portfolio.quotationPdf = { name: fileName, url };
    } else {
      const quote = portfolio.quotations.find((q) => q.id === quoteId);
      if (quote) {
        quote.pdfName = fileName;
        quote.pdfUrl = url;
      } else {
        portfolio.quotations.push({
          id: quoteId,
          title: fileName.replace(/\.pdf$/i, ''),
          price: '',
          details: '',
          pdfName: fileName,
          pdfUrl: url,
        });
      }
    }

    await savePortfolioForVendor(userId, listingId, portfolio);

    res.json({
      url,
      fileName,
      quoteId: quoteId || null,
      quotationPdf: portfolio.quotationPdf,
      quotations: portfolio.quotations,
    });
  } catch (err) {
    console.error('Upload vendor PDF error:', err);
    res.status(500).json({ error: 'Could not upload PDF.' });
  }
});

router.get('/vendors', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM vendor_listings ORDER BY spotlight DESC, name ASC');
    const listings = rows.map(listingFromRow);
    res.json({ listings });
  } catch (err) {
    console.error('Get vendor listings error:', err);
    res.status(500).json({ error: 'Could not load vendors.' });
  }
});

module.exports = router;
