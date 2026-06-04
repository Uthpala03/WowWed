const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'WowWedDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    trustedConnection: process.env.DB_TRUSTED_CONNECTION === 'true',
  },
};

let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

module.exports = { sql, getPool, config };
