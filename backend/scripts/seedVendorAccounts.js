const path = require('path');
const bcrypt = require('bcryptjs');

const DEMO_DOMAIN = 'vendors.wowwed.lk';

const DEMO_DETAIL_COLUMNS = [
  ['district', 'VARCHAR(50) DEFAULT NULL', 'city'],
  ['price_range', 'VARCHAR(50) DEFAULT NULL', 'district'],
  ['description', 'TEXT DEFAULT NULL', 'price_range'],
  ['packages', 'TEXT DEFAULT NULL', 'description'],
  ['locations', 'TEXT DEFAULT NULL', 'packages'],
  ['phone', 'VARCHAR(50) DEFAULT NULL', 'locations'],
  ['website', 'VARCHAR(255) DEFAULT NULL', 'phone'],
  ['address', 'VARCHAR(255) DEFAULT NULL', 'website'],
  ['owner_email', 'VARCHAR(100) DEFAULT NULL', 'address'],
  ['rating', 'DECIMAL(2, 1) DEFAULT NULL', 'owner_email'],
  ['spotlight', 'TINYINT(1) DEFAULT 0', 'rating'],
];

function demoEmail(listingId) {
  return `${listingId}@${DEMO_DOMAIN}`;
}

function demoPassword(listingId) {
  return `WowWed@${listingId}`;
}

function demoUsername(listingId) {
  return listingId;
}

function parsePortfolio(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function formatPackages(portfolio) {
  const quotes = Array.isArray(portfolio.quotations) ? portfolio.quotations : [];
  if (!quotes.length) return null;
  return quotes.map((quote) => {
    const title = String(quote.title || 'Package').trim();
    const price = String(quote.price || '').trim();
    const priceLabel = price ? `Rs. ${price}` : 'Price on request';
    const details = String(quote.details || '').trim();
    return details ? `${title} — ${priceLabel}. ${details}` : `${title} — ${priceLabel}`;
  }).join('\n');
}

function formatLocations(portfolio, fallbackCity, fallbackDistrict) {
  const locs = Array.isArray(portfolio.locations) ? portfolio.locations : [];
  if (locs.length) {
    return locs.map((loc) => (
      [loc.name, loc.city, loc.district].filter(Boolean).join(', ')
    )).filter(Boolean).join(' | ') || null;
  }
  const districts = Array.isArray(portfolio.districts) ? portfolio.districts.filter(Boolean) : [];
  if (districts.length) return districts.join(' | ');
  return [fallbackCity, fallbackDistrict].filter(Boolean).join(', ') || null;
}

function clip(value, max) {
  if (value == null || value === '') return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.length > max ? text.slice(0, max) : text;
}

async function ensureTables(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS vendor_demo_logins (
      listing_id VARCHAR(50) PRIMARY KEY,
      vendor_name VARCHAR(150) NOT NULL,
      category VARCHAR(100) DEFAULT NULL,
      city VARCHAR(50) DEFAULT NULL,
      district VARCHAR(50) DEFAULT NULL,
      price_range VARCHAR(50) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      packages TEXT DEFAULT NULL,
      locations TEXT DEFAULT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      website VARCHAR(255) DEFAULT NULL,
      address VARCHAR(255) DEFAULT NULL,
      owner_email VARCHAR(100) DEFAULT NULL,
      rating DECIMAL(2, 1) DEFAULT NULL,
      spotlight TINYINT(1) DEFAULT 0,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL,
      password_plain VARCHAR(100) NOT NULL,
      user_id INT DEFAULT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  for (const [column, definition, after] of DEMO_DETAIL_COLUMNS) {
    try {
      await connection.query(
        `ALTER TABLE vendor_demo_logins ADD COLUMN ${column} ${definition} AFTER ${after}`,
      );
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }
  }
  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      type VARCHAR(30) DEFAULT 'info',
      title VARCHAR(200) NOT NULL,
      message TEXT DEFAULT NULL,
      link VARCHAR(200) DEFAULT NULL,
      booking_id VARCHAR(50) DEFAULT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

async function upsertDemoLogin(connection, listing, userId, username, email, password) {
  const portfolio = parsePortfolio(listing.portfolio_json);
  await connection.query(
    `INSERT INTO vendor_demo_logins
      (listing_id, vendor_name, category, city, district, price_range, description, packages,
       locations, phone, website, address, owner_email, rating, spotlight,
       username, email, password_plain, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       vendor_name = VALUES(vendor_name),
       category = VALUES(category),
       city = VALUES(city),
       district = VALUES(district),
       price_range = VALUES(price_range),
       description = VALUES(description),
       packages = VALUES(packages),
       locations = VALUES(locations),
       phone = VALUES(phone),
       website = VALUES(website),
       address = VALUES(address),
       owner_email = VALUES(owner_email),
       rating = VALUES(rating),
       spotlight = VALUES(spotlight),
       username = VALUES(username),
       email = VALUES(email),
       password_plain = VALUES(password_plain),
       user_id = VALUES(user_id)`,
    [
      listing.id,
      listing.name,
      listing.category || null,
      listing.city || null,
      listing.district || null,
      listing.price_range || null,
      listing.description || null,
      formatPackages(portfolio),
      formatLocations(portfolio, listing.city, listing.district),
      clip(portfolio.phone, 50),
      clip(portfolio.website, 255),
      clip(portfolio.address, 255),
      listing.owner_email || clip(portfolio.email, 100),
      listing.rating || null,
      listing.spotlight ? 1 : 0,
      username,
      email,
      password,
      userId,
    ],
  );
}

async function seedVendorAccounts(connection, log = console.log) {
  await ensureTables(connection);
  const [listings] = await connection.query(
    `SELECT id, name, category, city, district, price_range, description, portfolio_json,
            rating, spotlight, owner_email, user_id
     FROM vendor_listings
     ORDER BY id`,
  );

  if (!listings.length) {
    log('  ! No vendor listings found — skip vendor account seed');
    return { ok: true, count: 0 };
  }

  log(`Seeding vendor logins and details for ${listings.length} catalogue listings…`);
  let created = 0;
  let updated = 0;

  for (const listing of listings) {
    const email = demoEmail(listing.id);
    const username = demoUsername(listing.id);
    const password = demoPassword(listing.id);
    const fullName = listing.name.slice(0, 100);

    const [demoRows] = await connection.query(
      'SELECT user_id, password_plain FROM vendor_demo_logins WHERE listing_id = ? LIMIT 1',
      [listing.id],
    );

    let userId = listing.user_id || demoRows[0]?.user_id || null;
    if (userId) {
      const [owned] = await connection.query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
      if (!owned.length) userId = null;
    }
    if (!userId) {
      const [existing] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      if (existing.length) userId = existing[0].id;
    }

    let passwordHash = null;
    let existingEmail = null;
    if (userId) {
      const [userRows] = await connection.query(
        'SELECT email, password_hash FROM users WHERE id = ? LIMIT 1',
        [userId],
      );
      existingEmail = userRows[0]?.email || null;
      const isDemoMail = existingEmail && existingEmail.toLowerCase() === email.toLowerCase();
      if (demoRows[0]?.password_plain === password && userRows[0]?.password_hash) {
        if (isDemoMail || await bcrypt.compare(password, userRows[0].password_hash)) {
          passwordHash = userRows[0].password_hash;
        }
      }
    }

    if (!userId) {
      passwordHash = await bcrypt.hash(password, 8);
      const [result] = await connection.query(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [fullName, email, passwordHash, 'vendor'],
      );
      userId = result.insertId;
      created += 1;
    } else if (!passwordHash) {
      passwordHash = await bcrypt.hash(password, 8);
      await connection.query(
        'UPDATE users SET full_name = ?, password_hash = ?, role = ? WHERE id = ?',
        [fullName, passwordHash, 'vendor', userId],
      );
      updated += 1;
    } else {
      updated += 1;
    }

    const portfolio = parsePortfolio(listing.portfolio_json);
    await connection.query(
      `INSERT INTO vendor_profiles
        (user_id, business_name, category, district, price_range, description, portfolio_json, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         business_name = VALUES(business_name),
         category = VALUES(category),
         district = VALUES(district),
         price_range = VALUES(price_range),
         description = VALUES(description),
         portfolio_json = VALUES(portfolio_json),
         rating = VALUES(rating),
         updated_at = NOW()`,
      [
        userId,
        listing.name,
        listing.category,
        listing.district,
        listing.price_range,
        listing.description || '',
        Object.keys(portfolio).length ? JSON.stringify(portfolio) : listing.portfolio_json || null,
        listing.rating || 4.5,
      ],
    );

    await connection.query(
      'UPDATE vendor_listings SET user_id = ? WHERE id = ?',
      [userId, listing.id],
    );

    await upsertDemoLogin(connection, listing, userId, username, email, password);
  }

  log(`  Vendor logins ready: ${created} created, ${updated} updated (${listings.length} total)`);
  log('  Presentation query: SELECT listing_id, vendor_name, category, city, district, username, email, password_plain FROM vendor_demo_logins ORDER BY listing_id;');
  log('  Example logins: vw-01 / WowWed@vw-01  ·  v1 / WowWed@v1  ·  vp-2 / WowWed@vp-2');
  return { ok: true, count: listings.length, created, updated };
}

module.exports = { seedVendorAccounts, demoEmail, demoPassword, demoUsername };

if (require.main === module) {
  (async () => {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wowwed',
    });
    try {
      await seedVendorAccounts(connection);
    } finally {
      await connection.end();
    }
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
