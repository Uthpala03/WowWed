const { initDatabase } = require('../config/initSchema');

require('dotenv').config();

initDatabase()
  .then(({ database, tableCount }) => {
    console.log(`WowWed schema initialized in "${database}" (${tableCount} tables).`);
  })
  .catch((err) => {
    console.error('Database init failed:', err.message || err);
    console.error('\nCheck backend/.env — set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME=wowwed');
    process.exit(1);
  });
