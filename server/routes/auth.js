const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, TOKEN_MAX_AGE, ADMIN_USER, ADMIN_HASH } = require('../config');

const router = Router();

// POST /api/login
router.post('/login', (req, res) => {
  const { user, password } = req.body;

  if (!user || !password) {
    return res.status(400).json({ ok: false, error: 'Lipsesc credențialele' });
  }

  if (user !== ADMIN_USER || !bcrypt.compareSync(password, ADMIN_HASH)) {
    return res.status(401).json({ ok: false, error: 'Login sau parolă incorectă' });
  }

  const token = jwt.sign({ sub: user }, JWT_SECRET, { expiresIn: '8h' });
  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: TOKEN_MAX_AGE,
    secure: false,
  });
  return res.json({ ok: true });
});

// POST /api/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token');
  return res.json({ ok: true });
});

// GET /api/me — verify session
router.get('/me', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ ok: false });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({ ok: true, user: payload.sub });
  } catch {
    res.clearCookie('auth_token');
    return res.status(401).json({ ok: false });
  }
});

module.exports = router;
