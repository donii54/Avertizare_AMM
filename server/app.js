const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt = require('jsonwebtoken');

const authRouter = require('./routes/auth');
const { JWT_SECRET } = require('./config');

const app = express();
const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, '../public');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', authRouter);

// ── Protected admin route ─────────────────────────────────────────────────────
app.get('/admin', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.redirect('/login.html');

  try {
    jwt.verify(token, JWT_SECRET);
    res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
  } catch {
    res.clearCookie('auth_token');
    res.redirect('/login.html');
  }
});

// ── Static files (public/) ────────────────────────────────────────────────────
// index.html in public/ is the public-facing map page
app.use(express.static(PUBLIC_DIR, { index: 'index.html' }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`  Public map:  http://localhost:${PORT}/`);
  console.log(`  Login:       http://localhost:${PORT}/login.html`);
  console.log(`  Admin:       http://localhost:${PORT}/admin`);
});
