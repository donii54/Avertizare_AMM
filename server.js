const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_MAX_AGE = 8 * 60 * 60 * 1000;

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_HASH = process.env.ADMIN_HASH || bcrypt.hashSync('admin', 10);

app.use(express.json());
app.use(cookieParser());

app.post('/api/login', async (req, res) => {
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

app.post('/api/logout', (_req, res) => {
  res.clearCookie('auth_token');
  return res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
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

function requireAuth(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ ok: false, error: 'Nu ești autentificat' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie('auth_token');
    return res.status(401).json({ ok: false, error: 'Sesiune expirată' });
  }
}

app.get('/admin', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.redirect('/login.html');
  try {
    jwt.verify(token, JWT_SECRET);
    res.sendFile(path.join(__dirname, 'index.html'));
  } catch {
    res.clearCookie('auth_token');
    res.redirect('/login.html');
  }
});

app.use(express.static(__dirname, {
  index: 'webpage.html',
  extensions: ['html'],
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`  Public page:  http://localhost:${PORT}/`);
  console.log(`  Admin panel:  http://localhost:${PORT}/admin`);
});
