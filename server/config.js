const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Load .env file if present (development convenience)
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours in ms

const ADMIN_USER = process.env.ADMIN_USER || 'admin';

// Password priority:
//   1. ADMIN_HASH env var — pre-generated bcrypt hash (most secure, for production)
//   2. ADMIN_PASSWORD env var — plain text, hashed at startup (convenient for dev)
//   3. Fallback hardcoded 'admin' (change before deploying!)
const ADMIN_HASH = (() => {
  if (process.env.ADMIN_HASH)     return process.env.ADMIN_HASH;
  if (process.env.ADMIN_PASSWORD) return bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
  return bcrypt.hashSync('admin', 10);
})();

module.exports = { JWT_SECRET, TOKEN_MAX_AGE, ADMIN_USER, ADMIN_HASH };
