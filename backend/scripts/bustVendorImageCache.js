require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wowwed',
  });
  const [rows] = await connection.query(
    "SELECT id, portfolio_json FROM vendor_listings WHERE id LIKE 'vw-%'",
  );
  let updated = 0;
  for (const row of rows) {
    const num = Number(String(row.id).replace('vw-', ''));
    if (num < 66) continue;
    const portfolio = typeof row.portfolio_json === 'string'
      ? JSON.parse(row.portfolio_json || '{}')
      : (row.portfolio_json || {});
    const images = (portfolio.images || []).map((url) => String(url).replace(/cover\.jpg(\?v=\d+)?$/, 'cover.jpg?v=3'));
    if (JSON.stringify(images) === JSON.stringify(portfolio.images || [])) continue;
    portfolio.images = images;
    await connection.query('UPDATE vendor_listings SET portfolio_json = ? WHERE id = ?', [
      JSON.stringify(portfolio),
      row.id,
    ]);
    updated += 1;
  }
  console.log('cache-busted', updated);
  await connection.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
