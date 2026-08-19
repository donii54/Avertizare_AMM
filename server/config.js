const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours in ms

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
// ADMIN_HASH can be a pre-generated bcrypt hash; defaults to bcrypt('admin')
const ADMIN_HASH = process.env.ADMIN_HASH || bcrypt.hashSync('admin', 10);

module.exports = { JWT_SECRET, TOKEN_MAX_AGE, ADMIN_USER, ADMIN_HASH };
