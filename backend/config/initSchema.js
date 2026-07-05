const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const SCHEMA_FILE = path.join(__dirname, '../../docs/mysql-setup.sql');

function loadSqlStatements() {
  const sql = fs.readFileSync(SCHEMA_FILE, 'utf8');

  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

function tableNameFromStatement(statement) {
  const match = statement.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i);
  return match ? match[1] : null;
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

      await connection.query(statement);
    }

    const [afterRows] = await connection.query('SHOW TABLES');
    const tableNames = afterRows.map((r) => Object.values(r)[0]);
    log(`Database "${database}" ready — ${tableNames.length} table(s): ${tableNames.join(', ')}`);

    return { ok: true, database, tableCount: tableNames.length, tables: tableNames };
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = { initDatabase, loadSqlStatements, SCHEMA_FILE };
