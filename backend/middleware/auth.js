const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'wowwed_dev_secret');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

module.exports = { authRequired };
