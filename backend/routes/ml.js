const http = require('http');
const express = require('express');

const router = express.Router();

function mlHost() {
  return process.env.ML_HOST || '127.0.0.1';
}

function costPort() {
  return Number(process.env.COST_ML_PORT || 8001);
}

function seatingPort() {
  return Number(process.env.SEATING_ML_PORT || 8000);
}

function postJson(port, path, body, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const req = http.request({
      hostname: mlHost(),
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw || '{}') });
        } catch {
          reject(new Error('Invalid ML response'));
        }
      });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('ML request timed out'));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

router.post('/cost', async (req, res) => {
  try {
    const result = await postJson(costPort(), '/predict', req.body);
    res.status(result.status || 200).json(result.body);
  } catch {
    res.status(503).json({ error: 'Cost prediction model is not running. Start the backend so the ML API can load.' });
  }
});

router.post('/seating', async (req, res) => {
  try {
    const result = await postJson(seatingPort(), '/optimize', req.body);
    res.status(result.status || 200).json(result.body);
  } catch {
    res.status(503).json({ error: 'Seating model is not running. Auto-seat will use the built-in fallback.' });
  }
});

module.exports = router;
