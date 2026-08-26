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

async function migrateSchema(connection, database) {
  await connection.query(`USE \`${database}\``);
  const alters = [
    'ALTER TABLE vendor_profiles ADD COLUMN portfolio_json JSON DEFAULT NULL',
    'ALTER TABLE vendor_listings ADD COLUMN portfolio_json JSON DEFAULT NULL',
    "ALTER TABLE checklist_templates ADD COLUMN ceremony VARCHAR(30) NOT NULL DEFAULT 'all'",
  ];
  for (const sql of alters) {
    try {
      await connection.query(sql);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }
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

    await migrateSchema(connection, database);

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

    return { ok: true, database, tableCount: tableNames.length, tables: tableNames };
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = { initDatabase, loadSqlStatements, SCHEMA_FILE };
