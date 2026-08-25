/**
 * Model: auth
 * Simple client-side auth stored in sessionStorage.
 * Credentials checked locally — no server needed.
 */

const AUTH_KEY      = 'moldova_admin_auth';
const ADMIN_LOGIN   = 'admin';
const ADMIN_PASSWORD = 'admin';

function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === '1';
}

function handleLogin(user, password) {
  if (user === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, '1');
    return true;
  }
  return false;
}

function handleLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  window.location.reload();
}
