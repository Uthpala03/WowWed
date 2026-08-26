const { spawn } = require('child_process');
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./config/initSchema');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const profileRoutes = require('./routes/profiles');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const notificationRoutes = require('./routes/notifications');
const mlRoutes = require('./routes/ml');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ml', mlRoutes);

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
    startSeatingApi();
    startCostApi();
  });
}

function startMlApi(label, folder, port, missingHint) {
  const dir = path.join(__dirname, '..', 'ML', folder);
  const child = spawn('python', ['-m', 'uvicorn', 'api:app', '--port', String(port)], {
    cwd: dir,
    windowsHide: true,
  });
  child.on('error', () => {
    console.log(`${label}: python not found. ${missingHint}`);
  });
  child.stderr.on('data', (buf) => {
    const text = String(buf);
    if (text.toLowerCase().includes('uvicorn running') || text.includes('Application startup complete')) {
      console.log(`${label} API running on port ${port}`);
    }
  });
}

function startSeatingApi() {
  startMlApi('Smart seating', 'seating', 8000, 'Auto-seat will use the built-in fallback.');
}

function startCostApi() {
  startMlApi('Cost prediction', 'cost', 8001, 'The Budget page will use the built-in estimate.');
}

start();
