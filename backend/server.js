const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./config/initSchema');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const profileRoutes = require('./routes/profiles');
const bookingRoutes = require('./routes/bookings');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'WowWed API is running!', appUrl: 'http://localhost:3001' });
});

app.get('/api/health', async (req, res) => {
  try {
    const { query } = require('./config/db');
    const tables = await query('SHOW TABLES');
    res.json({
      ok: true,
      database: process.env.DB_NAME || 'wowwed',
      tables: tables.length,
      connected: true,
    });
  } catch (err) {
    res.status(503).json({ ok: false, database: 'disconnected', error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5002;

async function start() {
  try {
    await initDatabase({ silent: false });
  } catch (err) {
    console.error('Could not initialize database:', err.message);
    console.error('Fix MySQL connection in backend/.env then restart the server.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`WowWed server running on port ${PORT}`);
    console.log(`Database: ${process.env.DB_NAME || 'wowwed'} @ ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
  });
}

start();
