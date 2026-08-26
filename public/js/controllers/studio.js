/**
 * Studio: Moldova map editor that publishes a live embeddable widget.
 */

const STUDIO_NORMAL_COLOR = '#28D762';

let studioMap = null;
let studioGeojson = null;
let currentColor = '#FFED00';
const districtData = {};
let currentToken = null;
let saveTimer = null;
let saving = false;

function showStudioList() {
  document.body.classList.remove('editor-mode');
  if (location.hash.startsWith('#edit')) history.replaceState(null, '', '/studio');
  loadMapList();
}

function showStudioEditor() {
  document.body.classList.add('editor-mode');
  requestAnimationFrame(() => {
    initStudioMap();
    refreshStudioMapSize();
  });
}

async function loadMapList() {
  const list = document.getElementById('studio-list');
  const data = await listMaps();
  if (!data.length) {
    list.innerHTML = `<div class="empty">Nu există hărți. Creează una și copiază linkul widgetului.</div>`;
    return;
  }
  list.innerHTML = data.map(item => {
    const count = (item.districts || []).length;
    const origin = location.origin;
    return `
      <div class="card yellow" onclick="openStudioMap('${item.token}')">
        <div>
          <div class="card-title">${escapeStudio(item.title || 'Hartă')}</div>
          <div class="card-meta">${count} raioane colorate · actualizat ${formatStudioTime(item.updatedAt)}</div>
        </div>
        <div class="card-codes">
          <button class="card-delete" onclick="event.stopPropagation(); copySnippet('${item.token}')">Copiază iframe</button>
          <a class="studio-preview-link" href="${origin}/widget-demo/${item.token}" target="_blank" onclick="event.stopPropagation()">Previzualizare</a>
          <button class="card-delete" onclick="onDeleteMap(event, '${item.token}')">Delete</button>
        </div>
      </div>`;
  }).join('');
}

function escapeStudio(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatStudioTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function iframeSnippet(token) {
  const src = `${location.origin}/embed/${token}`;
  return `<iframe src="${src}" width="100%" height="560" style="border:0;border-radius:12px" loading="lazy" title="Hartă"></iframe>`;
}

async function copySnippet(token) {
  const text = iframeSnippet(token);
  try {
    await navigator.clipboard.writeText(text);
    alert('Codul iframe a fost copiat');
  } catch {
    prompt('Copiază iframe:', text);
  }
}

async function onDeleteMap(event, token) {
  event.stopPropagation();
  if (!confirm('Șterge harta? Widgetul nu va mai funcționa.')) return;
  await deleteMap(token);
  loadMapList();
}

async function createAndEdit() {
  const map = await createMap({ title: 'Hartă nouă', districts: [] });
  await openStudioMap(map.token);
}

async function openStudioMap(token) {
  currentToken = token;
  Object.keys(districtData).forEach(k => delete districtData[k]);
  const map = await getMap(token);
  document.getElementById('map-title').value = map.title || '';
  document.getElementById('embed-url').value = `${location.origin}/embed/${token}`;
  document.getElementById('embed-code').value = iframeSnippet(token);
  history.replaceState(null, '', `/studio#edit/${token}`);
  showStudioEditor();
  applySavedDistricts(map.districts || []);
  updateCount();
}

function applySavedDistricts(districts) {
  if (!studioGeojson) {
    setTimeout(() => applySavedDistricts(districts), 80);
    return;
  }
  studioGeojson.eachLayer(l => studioGeojson.resetStyle(l));
  const byName = {};
  districts.forEach(d => { if (d.name) byName[d.name] = d; });
  studioGeojson.eachLayer(layer => {
    const id = getStudioId(layer.feature);
    const name = layer.feature.properties._name;
    const saved = byName[name];
    if (!saved) return;
    districtData[id] = {
      name,
      label: layer.feature.properties._label,
      color: saved.color,
    };
    layer.setStyle({ fillColor: saved.color, fillOpacity: 0.85, weight: 1.5, color: '#334155' });
  });
  updateCount();
}

function paintedDistricts() {
  return Object.values(districtData).filter(d => d.color && d.color !== STUDIO_NORMAL_COLOR);
}

function scheduleSave() {
  if (!currentToken) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistMap, 700);
  const status = document.getElementById('save-status');
  if (status) status.textContent = 'Se salvează…';
}

async function persistMap() {
  if (!currentToken) return;
  if (saving) {
    scheduleSave();
    return;
  }
  saving = true;
  try {
    const saved = await saveMap(currentToken, {
      title: document.getElementById('map-title').value.trim() || 'Hartă',
      districts: paintedDistricts(),
    });
    const status = document.getElementById('save-status');
    if (status) status.textContent = 'Salvat — widgetul se actualizează automat';
    document.getElementById('embed-url').value = `${location.origin}${saved.embedPath}`;
    document.getElementById('embed-code').value = iframeSnippet(currentToken);
  } catch (err) {
    const status = document.getElementById('save-status');
    if (status) status.textContent = 'Eroare: ' + err.message;
  } finally {
    saving = false;
  }
}

function getStudioId(feature) {
  return feature.properties.shapeID || feature.properties.shapeName || Math.random().toString(36).slice(2);
}

function refreshStudioMapSize() {
  if (!studioMap) return;
  studioMap.invalidateSize(true);
  if (studioGeojson) studioMap.fitBounds(studioGeojson.getBounds(), { padding: [15, 15] });
}

function setDistrictColor(layer, color) {
  const id = getStudioId(layer.feature);
  const fullName = layer.feature.properties._name;
  const label = layer.feature.properties._label;
  if (color === STUDIO_NORMAL_COLOR) {
    delete districtData[id];
    studioGeojson.resetStyle(layer);
    updateCount();
    scheduleSave();
    return;
  }
  layer.setStyle({ fillColor: color, fillOpacity: 0.85, weight: 1.5, color: '#334155' });
  districtData[id] = { name: fullName, label, color };
  updateCount();
  scheduleSave();
}

function paintDistrict(layer, toggle) {
  if (currentColor === STUDIO_NORMAL_COLOR) {
    setDistrictColor(layer, STUDIO_NORMAL_COLOR);
    return;
  }
  const id = getStudioId(layer.feature);
  if (toggle && districtData[id]?.color === currentColor) {
    setDistrictColor(layer, STUDIO_NORMAL_COLOR);
    return;
  }
  setDistrictColor(layer, currentColor);
}

function paintAllDistricts() {
  if (!studioGeojson) return;
  studioGeojson.eachLayer(l => setDistrictColor(l, currentColor));
}

function resetMapColors() {
  Object.keys(districtData).forEach(k => delete districtData[k]);
  if (studioGeojson) studioGeojson.eachLayer(l => studioGeojson.resetStyle(l));
  updateCount();
  scheduleSave();
}

function updateCount() {
  const el = document.getElementById('count');
  if (el) el.textContent = Object.keys(districtData).length;
}

function initStudioMap() {
  if (studioMap) {
    refreshStudioMapSize();
    return;
  }

  studioMap = L.map('map', {
    zoomControl: false, dragging: false, touchZoom: false,
    scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false,
    keyboard: false, attributionControl: false, preferCanvas: true,
  });

  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = btn.dataset.color;
    });
  });

  fetch('/data/MD_MAP.geojson')
    .then(r => r.json())
    .then(data => {
      studioGeojson = L.geoJSON(data, {
        style: { color: '#f2f7f7', weight: 1.2, fillColor: STUDIO_NORMAL_COLOR, fillOpacity: 0.85 },
        onEachFeature: (feature, layer) => {
          const fullName = feature.properties.shapeName || '???';
          const label = districtLabel(fullName);
          layer.feature.properties._name = fullName;
          layer.feature.properties._label = label;
          layer.bindTooltip(label, { permanent: true, direction: 'center', className: 'district-label' });
          layer.on({
            click(e) { if (e.originalEvent?.shiftKey) { L.DomEvent.stop(e); paintDistrict(e.target, false); } },
            dblclick(e) { if (!e.originalEvent?.shiftKey) { L.DomEvent.stop(e); paintDistrict(e.target, true); } },
          });
        },
      }).addTo(studioMap);
      setTimeout(refreshStudioMapSize, 50);
    })
    .catch(err => {
      alert('Nu s-a putut încărca harta.');
      console.error(err);
    });
}

window.addEventListener('DOMContentLoaded', async () => {
  const authed = await checkAuth();
  if (!authed) {
    window.location.replace('/login');
    return;
  }
  document.body.classList.add('logged-in');
  initStudioMap();
  document.getElementById('map-title').addEventListener('input', scheduleSave);

  const hash = location.hash;
  const match = hash.match(/^#edit\/(.+)$/);
  if (match) {
    await openStudioMap(match[1]);
  } else {
    loadMapList();
  }
});
