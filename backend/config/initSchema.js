const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const SCHEMA_FILE = path.join(__dirname, '../../docs/mysql-setup.sql');

function stripSqlComments(sql) {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
}

function loadSqlStatements() {
  const sql = stripSqlComments(fs.readFileSync(SCHEMA_FILE, 'utf8'));
  const statements = [];
  let current = '';
  let inSingle = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (ch === "'" && inSingle && next === "'") {
      current += "''";
      i += 1;
      continue;
    }

    if (ch === "'") {
      inSingle = !inSingle;
      current += ch;
      continue;
    }

    if (ch === ';' && !inSingle) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = '';
      continue;
    }

    current += ch;
  }

  const last = current.trim();
  if (last) statements.push(last);
  return statements;
}

function tableNameFromStatement(statement) {
  const match = statement.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i);
  return match ? match[1] : null;
}

async function migrateSchema(connection, database, log = console.log) {
  await connection.query(`USE \`${database}\``);
  const alters = [
    'ALTER TABLE vendor_profiles ADD COLUMN portfolio_json JSON DEFAULT NULL',
    'ALTER TABLE vendor_listings ADD COLUMN portfolio_json JSON DEFAULT NULL',
    "ALTER TABLE checklist_templates ADD COLUMN ceremony VARCHAR(30) NOT NULL DEFAULT 'all'",
    'ALTER TABLE bookings ADD COLUMN vendor_listing_id VARCHAR(50) DEFAULT NULL',
    'ALTER TABLE bookings ADD COLUMN vendor_user_id INT DEFAULT NULL',
    'ALTER TABLE bookings ADD COLUMN category VARCHAR(100) DEFAULT NULL',
    'ALTER TABLE bookings ADD COLUMN vendor_note TEXT DEFAULT NULL',
    'ALTER TABLE bookings ADD COLUMN couple_note TEXT DEFAULT NULL',
    'ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'ALTER TABLE bookings MODIFY COLUMN status VARCHAR(30) DEFAULT \'Pending\'',
    'ALTER TABLE vendor_demo_logins ADD COLUMN district VARCHAR(50) DEFAULT NULL AFTER city',
    'ALTER TABLE vendor_demo_logins ADD COLUMN price_range VARCHAR(50) DEFAULT NULL AFTER district',
    'ALTER TABLE vendor_demo_logins ADD COLUMN description TEXT DEFAULT NULL AFTER price_range',
    'ALTER TABLE vendor_demo_logins ADD COLUMN packages TEXT DEFAULT NULL AFTER description',
    'ALTER TABLE vendor_demo_logins ADD COLUMN locations TEXT DEFAULT NULL AFTER packages',
    'ALTER TABLE vendor_demo_logins ADD COLUMN phone VARCHAR(50) DEFAULT NULL AFTER locations',
    'ALTER TABLE vendor_demo_logins ADD COLUMN website VARCHAR(255) DEFAULT NULL AFTER phone',
    'ALTER TABLE vendor_demo_logins ADD COLUMN address VARCHAR(255) DEFAULT NULL AFTER website',
    'ALTER TABLE vendor_demo_logins ADD COLUMN owner_email VARCHAR(100) DEFAULT NULL AFTER address',
    'ALTER TABLE vendor_demo_logins ADD COLUMN rating DECIMAL(2, 1) DEFAULT NULL AFTER owner_email',
    'ALTER TABLE vendor_demo_logins ADD COLUMN spotlight TINYINT(1) DEFAULT 0 AFTER rating',
  ];
  for (const sql of alters) {
    try {
      await connection.query(sql);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        log(`  ! Schema alter skipped: ${err.message}`);
      }
    }
  }

  try {
    await connection.query(`
      UPDATE bookings b
      INNER JOIN vendor_listings l ON LOWER(l.name) = LOWER(b.vendor_name)
      INNER JOIN (
        SELECT name FROM vendor_listings GROUP BY name HAVING COUNT(*) = 1
      ) uniq ON LOWER(uniq.name) = LOWER(l.name)
      SET b.vendor_listing_id = l.id,
          b.vendor_user_id = l.user_id
      WHERE (b.vendor_listing_id IS NULL OR b.vendor_listing_id = '')
        AND b.vendor_name IS NOT NULL AND b.vendor_name != ''
    `);
    await connection.query(`
      UPDATE bookings b
      INNER JOIN vendor_listings l ON l.id = b.vendor_listing_id
      SET b.vendor_user_id = l.user_id
      WHERE l.user_id IS NOT NULL
        AND (b.vendor_user_id IS NULL OR b.vendor_user_id != l.user_id)
    `);
    await connection.query(`
      UPDATE bookings b
      INNER JOIN vendor_listings l ON LOWER(l.owner_email) = LOWER(b.vendor_email)
      INNER JOIN (
        SELECT owner_email FROM vendor_listings
        WHERE owner_email IS NOT NULL AND owner_email != ''
        GROUP BY owner_email HAVING COUNT(*) = 1
      ) uniq ON LOWER(uniq.owner_email) = LOWER(l.owner_email)
      SET b.vendor_listing_id = l.id,
          b.vendor_user_id = COALESCE(l.user_id, b.vendor_user_id)
      WHERE (b.vendor_listing_id IS NULL OR b.vendor_listing_id = '')
        AND b.vendor_email IS NOT NULL AND b.vendor_email != ''
    `);
    await connection.query(`
      UPDATE bookings b
      INNER JOIN users u ON u.id = b.vendor_user_id
      SET b.vendor_email = u.email
      WHERE b.vendor_user_id IS NOT NULL
        AND (b.vendor_email IS NULL OR b.vendor_email = '' OR b.vendor_email != u.email)
    `);
  } catch (err) {
    log(`  ! Booking listing repair skipped: ${err.message}`);
  }
}

async function initDatabase(options = {}) {
  const host = options.host || process.env.DB_HOST || 'localhost';
  const port = Number(options.port || process.env.DB_PORT || 3306);
  const user = options.user || process.env.DB_USER || 'root';
  const password = options.password ?? process.env.DB_PASSWORD ?? '';
  const database = options.database || process.env.DB_NAME || 'wowwed';
  const silent = options.silent ?? false;

  const log = (...args) => {
    if (!silent) console.log(...args);
  };

  const statements = loadSqlStatements();
  let connection;

  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: false,
    });

    log(`MySQL connected (${host}:${port})`);

    const [beforeRows] = await connection.query(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
      [database],
    ).catch(() => [[]]);
    const beforeTables = new Set(beforeRows.map((r) => r.TABLE_NAME));

    for (const statement of statements) {
      const upper = statement.toUpperCase();
      if (upper.startsWith('CREATE DATABASE')) {
        await connection.query(statement);
        continue;
      }
      if (upper.startsWith('USE ')) {
        await connection.query(`USE \`${database}\``);
        continue;
      }

      await connection.query(`USE \`${database}\``);

      const tableName = tableNameFromStatement(statement);
      if (tableName && !beforeTables.has(tableName)) {
        log(`  + Creating table: ${tableName}`);
      }

      try {
        await connection.query(statement);
      } catch (err) {
        const isSeed = upper.startsWith('INSERT') || upper.startsWith('UPDATE');
        if (!isSeed) throw err;
        log(`  ! Skipped seed statement: ${err.message}`);
      }
    }

    await migrateSchema(connection, database, log);

    for (const statement of statements) {
      const upper = statement.toUpperCase();
      if (!upper.startsWith('INSERT') && !upper.startsWith('UPDATE')) continue;
      try {
        await connection.query(`USE \`${database}\``);
        await connection.query(statement);
      } catch (err) {
        log(`  ! Skipped seed statement: ${err.message}`);
      }
    }

    const [afterRows] = await connection.query('SHOW TABLES');
    const tableNames = afterRows.map((r) => Object.values(r)[0]);
    log(`Database "${database}" ready — ${tableNames.length} table(s): ${tableNames.join(', ')}`);

    try {
      const { attachVendorMedia } = require('../scripts/attachVendorMedia');
      await attachVendorMedia(connection, log);
    } catch (err) {
      log(`  ! Vendor media attach skipped: ${err.message}`);
    }

    try {
      const { seedSriLankaVendors } = require('../scripts/seedSriLankaVendors');
      await seedSriLankaVendors(connection, log);
    } catch (err) {
      log(`  ! Extra Sri Lankan vendors skipped: ${err.message}`);
    }

    try {
      const { seedVendorAccounts } = require('../scripts/seedVendorAccounts');
      await seedVendorAccounts(connection, log);
    } catch (err) {
      log(`  ! Vendor account seed skipped: ${err.message}`);
    }

    return { ok: true, database, tableCount: tableNames.length, tables: tableNames };
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = { initDatabase, loadSqlStatements, SCHEMA_FILE };
