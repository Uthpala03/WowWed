const path = require('path');
const bcrypt = require('bcryptjs');

const DEMO_DOMAIN = 'vendors.wowwed.lk';

function demoEmail(listingId) {
  return `${listingId}@${DEMO_DOMAIN}`;
}

function demoPassword(listingId) {
  return `WowWed@${listingId}`;
}

function demoUsername(listingId) {
  return listingId;
}

async function ensureTables(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS vendor_demo_logins (
      listing_id VARCHAR(50) PRIMARY KEY,
      vendor_name VARCHAR(150) NOT NULL,
      category VARCHAR(100) DEFAULT NULL,
      city VARCHAR(50) DEFAULT NULL,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL,
      password_plain VARCHAR(100) NOT NULL,
      user_id INT DEFAULT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
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

async function seedVendorAccounts(connection, log = console.log) {
  await ensureTables(connection);
  const [listings] = await connection.query(
    "SELECT id, name, category, city, district, price_range, description, portfolio_json, rating, owner_email FROM vendor_listings WHERE id LIKE 'vw-%' ORDER BY id",
  );

  if (!listings.length) {
    log('  ! No vw-* vendor listings found — skip vendor account seed');
    return { ok: true, count: 0 };
  }

  log(`Seeding vendor logins for ${listings.length} catalogue listings…`);
  let created = 0;
  let updated = 0;

  for (const listing of listings) {
    const [demoRows] = await connection.query(
      'SELECT user_id, password_plain FROM vendor_demo_logins WHERE listing_id = ? LIMIT 1',
      [listing.id],
    );
    if (demoRows[0]?.user_id && demoRows[0].password_plain === demoPassword(listing.id)) {
      await connection.query('UPDATE vendor_listings SET user_id = ? WHERE id = ?', [
        demoRows[0].user_id,
        listing.id,
      ]);
      updated += 1;
      continue;
    }

    const email = demoEmail(listing.id);
    const username = demoUsername(listing.id);
    const password = demoPassword(listing.id);
    const passwordHash = await bcrypt.hash(password, 8);
    const fullName = listing.name.slice(0, 100);

    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email],
    );

    let userId;
    if (existing.length) {
      userId = existing[0].id;
      await connection.query(
        'UPDATE users SET full_name = ?, password_hash = ?, role = ? WHERE id = ?',
        [fullName, passwordHash, 'vendor', userId],
      );
      updated += 1;
    } else {
      const [result] = await connection.query(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [fullName, email, passwordHash, 'vendor'],
      );
      userId = result.insertId;
      created += 1;
    }

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
        listing.portfolio_json == null
          ? null
          : (typeof listing.portfolio_json === 'string'
            ? listing.portfolio_json
            : JSON.stringify(listing.portfolio_json)),
        listing.rating || 4.5,
      ],
    );

    await connection.query(
      'UPDATE vendor_listings SET user_id = ? WHERE id = ?',
      [userId, listing.id],
    );

    await connection.query(
      `INSERT INTO vendor_demo_logins
        (listing_id, vendor_name, category, city, username, email, password_plain, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         vendor_name = VALUES(vendor_name),
         category = VALUES(category),
         city = VALUES(city),
         username = VALUES(username),
         email = VALUES(email),
         password_plain = VALUES(password_plain),
         user_id = VALUES(user_id)`,
      [
        listing.id,
        listing.name,
        listing.category,
        listing.city,
        username,
        email,
        password,
        userId,
      ],
    );
  }

  log(`  Vendor logins ready: ${created} created, ${updated} updated (${listings.length} total)`);
  log('  Presentation query: SELECT listing_id, vendor_name, username, email, password_plain FROM vendor_demo_logins;');
  log('  Example login: username vw-01  ·  password WowWed@vw-01');
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
