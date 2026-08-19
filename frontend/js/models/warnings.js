/**
 * Model: warnings
 * Stores warnings in browser localStorage — no server required.
 */

const STORAGE_KEY = 'moldova_weather_warnings';

function getWarnings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function addWarning(payload) {
  const data = getWarnings();
  data.unshift(payload);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return payload;
}

function deleteWarning(targetId) {
  const data = getWarnings().filter((item, index) => getWarningId(item, index) !== targetId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearWarnings() {
  localStorage.removeItem(STORAGE_KEY);
}

function getWarningId(item, index) {
  return item.id || item.createdAt || String(index);
}

function getExpiryTime(item) {
  const value = item.intervalTo ||
    (item.interval && item.interval.includes('T') ? item.interval : null);
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function formatDateTime(value) {
  if (!value) return '';
  if (!value.includes('T')) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins  = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year}, ora ${hours}:${mins}`;
}

function formatInterval(item) {
  if (item.intervalFrom && item.intervalTo) {
    return `${formatDateTime(item.intervalFrom)} – ${formatDateTime(item.intervalTo)}`;
  }
  return item.interval || '';
}
