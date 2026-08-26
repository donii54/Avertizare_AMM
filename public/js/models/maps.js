/**
 * Model: embeddable maps
 */

async function listMaps() {
  const res = await fetch('/api/maps', { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
  if (!res.ok) return [];
  return res.json();
}

async function getMap(token) {
  const res = await fetch(`/api/maps/${encodeURIComponent(token)}?t=${Date.now()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Harta nu a fost găsită');
  return res.json();
}

async function createMap(payload = {}) {
  const res = await fetch('/api/maps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Eroare la creare');
  return res.json();
}

async function saveMap(token, payload) {
  const res = await fetch(`/api/maps/${encodeURIComponent(token)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Eroare la salvare');
  return res.json();
}

async function deleteMap(token) {
  const res = await fetch(`/api/maps/${encodeURIComponent(token)}`, {
    method: 'DELETE',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  if (!res.ok) throw new Error('Eroare la ștergere');
}
