const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function requireAuth(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Nu ești autentificat' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie('auth_token');
    return res.status(401).json({ ok: false, error: 'Sesiune expirată' });
  }
}

module.exports = requireAuth;
