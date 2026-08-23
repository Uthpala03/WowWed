const http = require('http');
const express = require('express');

const router = express.Router();

function postJson(port, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const req = http.request({
      hostname: '127.0.0.1',
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
          reject(new Error('Invalid cost prediction response'));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

router.post('/cost', async (req, res) => {
  try {
    const result = await postJson(8001, '/predict', req.body);
    res.status(result.status || 200).json(result.body);
  } catch {
    res.status(503).json({ error: 'Cost prediction model is not running. Start the backend so the ML API can load.' });
  }
});

module.exports = router;
