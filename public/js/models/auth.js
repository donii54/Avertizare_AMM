/**
 * Model: auth
 * Client-side session checks via server API.
 */

async function checkAuth() {
  try {
    const res = await fetch('/api/me');
    return res.ok;
  } catch {
    return false;
  }
}

async function handleLogout() {
  await fetch('/api/logout', { method: 'POST' });
  // Reload the same /admin page — it will show the login form
  window.location.reload();
}
