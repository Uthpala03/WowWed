/**
 * Initialize WowWed MySQL database from docs/mysql-setup.sql
 * Usage: npm run db:init --prefix backend
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const sqlPath = path.join(__dirname, '../../docs/mysql-setup.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Connected to MySQL. Running schema…');

  for (const statement of statements) {
    if (statement.toUpperCase().startsWith('USE ')) {
      await connection.query(statement);
      continue;
    }
    await connection.query(statement);
  }

  await connection.end();
  console.log('WowWed database ready.');
}

main().catch((err) => {
  console.error('Database init failed:', err.message || err);
  console.error('\nMake sure MySQL is installed and running, then set DB_PASSWORD in backend/.env');
  console.error('Example: mysql -u root -p < docs/mysql-setup.sql');
  process.exit(1);
});
