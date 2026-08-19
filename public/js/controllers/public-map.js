/**
 * Controller: public-map
 * Drives the public-facing Moldova weather warnings page.
 * Depends on: models/warnings.js, district-codes.js (global districtLabel)
 */

const PUBLIC_MAP_NORMAL_COLOR = '#28D762';
const POPUP_DISMISSED_KEY = 'moldova_warnings_popup_dismissed';
// New random ID per page load — popup auto-opens on reload,
// but stays closed after user dismisses it (within the same page load).
const POPUP_INSTANCE_ID = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

let publicMap         = null;
let publicGeojsonLayer = null;
let districtWarnings  = {};
let selectedWarningIndex = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtmlPublic(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function colorRank(color) {
  if (!color) return 0;
  const v = color.toLowerCase();
  if (v.includes('ff0000') || v.includes('ef4444')) return 4;
  if (v.includes('ff8a00') || v.includes('f97316')) return 3;
  if (v.includes('ffed00') || v.includes('eab308')) return 2;
  if (v.includes('28d762') || v.includes('22c55e')) return 1;
  return 0;
}

function codeMeta(code) {
  if (code.includes('ROȘU'))      return { color: '#FF0000', box: 'bg-red-50 border-red-200',     title: 'text-red-800' };
  if (code.includes('PORTOCALIU')) return { color: '#FF8A00', box: 'bg-orange-50 border-orange-200', title: 'text-orange-800' };
  if (code.includes('VERDE'))     return { color: '#28D762', box: 'bg-emerald-50 border-emerald-200', title: 'text-emerald-800' };
  return { color: '#FFED00', box: 'bg-amber-50 border-amber-200', title: 'text-amber-800' };
}

// ── Warning card (side panel) ─────────────────────────────────────────────────
function codesHtml(codes) {
  if (!codes?.length) return '';
  return `<div class="mt-3 flex flex-col gap-2">${codes.map(c => {
    const meta = codeMeta(c.code);
    return `
      <div class="rounded-xl border p-3 ${meta.box}">
        <div class="mb-1 flex items-center gap-2 text-sm font-bold ${meta.title}">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" style="background:${meta.color}"></span>
          ${escapeHtmlPublic(c.code)}
        </div>
        <div class="text-[15px] leading-relaxed text-slate-700">${escapeHtmlPublic(c.description || 'Fără descriere')}</div>
      </div>`;
  }).join('')}</div>`;
}

function warningCardHtml(item, index, isSelected) {
  const cls = isSelected
    ? 'bg-white border-brand-200 shadow-md ring-2 ring-brand-100'
    : 'bg-slate-50 border-slate-200 shadow-none';
  return `
    <article class="mb-3 cursor-pointer rounded-xl border p-4 outline-none transition hover:border-brand-200 hover:bg-white ${cls}"
             data-warning="${index}" onclick="selectWarning(${index})">
      <h3 class="text-base font-bold text-brand-700">${escapeHtmlPublic(item.phenomenon || 'Avertizare meteorologică')}</h3>
      <p class="mt-1 text-[11px] text-slate-500">${escapeHtmlPublic(formatInterval(item) || formatDateTime(item.emitDate))}</p>
      ${codesHtml(item.codes)}
    </article>`;
}

function renderPopupToggleButton() {
  const btn = document.getElementById('open-popup-btn');
  if (!btn) return;
  const hasWarnings = getWarnings().length > 0;
  btn.disabled    = !hasWarnings;
  btn.textContent = hasWarnings ? 'Deschide popup' : 'Nu există avertizări';
}

function renderPhenomenaPanel() {
  const panel = document.getElementById('phenomena-panel');
  const data  = getWarnings();
  renderPopupToggleButton();
  if (!data.length) { panel.innerHTML = ''; return; }
  panel.innerHTML = data
    .map((item, index) => warningCardHtml(item, index, selectedWarningIndex === index))
    .join('');
}

// ── Popup ─────────────────────────────────────────────────────────────────────
function alertBlockHtml(item, index) {
  const img = item.mapImage
    ? `<img src="${item.mapImage}" alt="Harta">`
    : `<div class="flex items-center justify-center rounded-xl bg-slate-50 py-12 text-center text-sm text-slate-400" style="min-height:180px">Fără hartă</div>`;

  const codeBadges = (item.codes || []).map(c => {
    const meta = codeMeta(c.code);
    const textColor = meta.color === '#FFED00' ? '#78350f' : '#fff';
    return `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style="background:${meta.color};color:${textColor}">${escapeHtmlPublic(c.code)}</span>`;
  }).join('');

  const codesFooterRows = (item.codes || []).map(c => {
    const meta = codeMeta(c.code);
    return `
      <div class="flex items-start gap-3 rounded-xl border p-3 ${meta.box}">
        <span class="mt-0.5 h-3 w-3 shrink-0 rounded-full" style="background:${meta.color}"></span>
        <div class="min-w-0">
          <div class="text-xs font-bold ${meta.title}">${escapeHtmlPublic(c.code)}</div>
          <div class="mt-0.5 text-sm leading-relaxed text-slate-700">${escapeHtmlPublic(c.description || 'Fără descriere')}</div>
        </div>
      </div>`;
  }).join('');

  return `
    <section class="border-b border-slate-100 px-6 py-5 last:border-b-0" id="alert-${index}">
      <div class="alert-content flex items-stretch gap-5">
        <div class="popup-map w-[30%] min-w-[160px] max-w-[280px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">${img}</div>
        <div class="flex min-w-0 flex-1 flex-col justify-center">
          <h3 class="mb-2 text-lg font-extrabold text-slate-900">${escapeHtmlPublic(item.phenomenon || 'Avertizare meteorologică')}</h3>
          <div class="mb-1 flex flex-wrap gap-1 text-sm">
            <span class="text-slate-500">Data emiterii:</span>
            <span class="font-semibold text-slate-900">${escapeHtmlPublic(formatDateTime(item.emitDate) || '—')}</span>
          </div>
          <div class="mb-3 flex flex-wrap gap-1 text-sm">
            <span class="text-slate-500">Intervalul de acțiune:</span>
            <span class="font-semibold text-slate-900">${escapeHtmlPublic(formatInterval(item) || '—')}</span>
          </div>
          <div class="flex flex-wrap gap-2">${codeBadges}</div>
        </div>
      </div>
      ${codesFooterRows ? `<div class="mt-4 grid gap-2 sm:grid-cols-2">${codesFooterRows}</div>` : ''}
    </section>`;
}

function showStartupPopups(force = false) {
  const data    = getWarnings();
  const list    = document.getElementById('popup-list');
  const overlay = document.getElementById('overlay');
  renderPopupToggleButton();

  if (!data.length) {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    return;
  }
  if (!force && sessionStorage.getItem(POPUP_DISMISSED_KEY) === POPUP_INSTANCE_ID) return;

  list.innerHTML = data.map((item, index) => alertBlockHtml(item, index)).join('');
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
}

function openPopup(index) {
  showStartupPopups(true);
  if (typeof index === 'number') {
    const block = document.getElementById('alert-' + index);
    if (block) block.scrollIntoView({ block: 'nearest' });
  }
}

function closePopup(e, { persistDismissal = true } = {}) {
  if (e && e.target?.id !== 'overlay') return;
  const overlay = document.getElementById('overlay');
  overlay.classList.add('hidden');
  overlay.classList.remove('flex');
  if (persistDismissal) sessionStorage.setItem(POPUP_DISMISSED_KEY, POPUP_INSTANCE_ID);
}

// ── Map ───────────────────────────────────────────────────────────────────────
function layerKeys(layer) {
  return {
    name:  layer.feature.properties.shapeName || layer.feature.properties.NAME || layer.feature.properties.name,
    label: layer.feature.properties._label,
  };
}

function restoreLayer(layer) {
  const { name, label } = layerKeys(layer);
  const found = districtWarnings[name] || districtWarnings[label];
  if (found?.color) {
    layer.setStyle({ fillColor: found.color, fillOpacity: 0.9, color: '#ffffff', weight: 1.3 });
  } else {
    publicGeojsonLayer.resetStyle(layer);
  }
}

function applyMapColors() {
  if (!publicGeojsonLayer) return;
  const warnings = getWarnings();
  const source   = selectedWarningIndex == null
    ? warnings.map((warning, index) => ({ warning, index }))
    : warnings[selectedWarningIndex]
      ? [{ warning: warnings[selectedWarningIndex], index: selectedWarningIndex }]
      : [];

  const result = {};
  source.forEach(({ warning, index }) => {
    (warning.districts || []).forEach(district => {
      [district.name, district.label].filter(Boolean).forEach(key => {
        const current = result[key];
        if (!current || colorRank(district.color) > colorRank(current.color)) {
          result[key] = { color: district.color, warningIndex: index, warning };
        }
      });
    });
  });
  districtWarnings = result;
  publicGeojsonLayer.eachLayer(restoreLayer);
  renderPhenomenaPanel();
}

function selectWarning(index) {
  selectedWarningIndex = index;
  applyMapColors();
}

function initPublicMap() {
  publicMap = L.map('map', {
    zoomControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false,
    doubleClickZoom: false, boxZoom: false, keyboard: false, attributionControl: false,
    preferCanvas: true, zoomSnap: 0, zoomDelta: 0.1,
  });

  fetch('/data/MD_MAP.geojson')
    .then(r => r.json())
    .then(data => {
      publicGeojsonLayer = L.geoJSON(data, {
        style: { color: '#ffffff', weight: 1.3, fillColor: PUBLIC_MAP_NORMAL_COLOR, fillOpacity: 0.9 },
        onEachFeature: (feature, layer) => {
          const fullName = feature.properties.shapeName ||
                           feature.properties.NAME ||
                           feature.properties.name || '???';
          const label = districtLabel(fullName);
          layer.feature.properties._label = label;
          layer.bindTooltip(label, { permanent: true, direction: 'center', className: 'district-label' });

          layer.on({
            mouseover: e => {
              e.target.setStyle({ weight: 3, color: '#0f172a', fillOpacity: 0.98 });
              e.target.bringToFront();
            },
            mouseout: e => restoreLayer(e.target),
            click:    () => {
              const found = districtWarnings[fullName] || districtWarnings[label];
              if (found) selectWarning(found.warningIndex);
            },
          });
        },
      }).addTo(publicMap);

      function fitMapToCountry() {
        if (!publicMap || !publicGeojsonLayer) return;
        const el = publicMap.getContainer();
        if (!el.clientWidth || !el.clientHeight) return;
        publicMap.invalidateSize({ animate: false });
        publicMap.fitBounds(publicGeojsonLayer.getBounds(), {
          paddingTopLeft: [4, 12], paddingBottomRight: [440, 12],
          animate: false, maxZoom: 20,
        });
      }

      fitMapToCountry();
      requestAnimationFrame(fitMapToCountry);
      setTimeout(fitMapToCountry, 50);
      setTimeout(fitMapToCountry, 250);
      window.addEventListener('resize', fitMapToCountry);
      if (window.ResizeObserver) {
        new ResizeObserver(fitMapToCountry).observe(document.getElementById('map'));
      }
      applyMapColors();
    })
    .catch(err => console.error('Map load error:', err));
}

// ── Expiry check ──────────────────────────────────────────────────────────────
let publicExpiryTimer = null;

function schedulePublicExpiryCheck() {
  clearTimeout(publicExpiryTimer);
  if (removeExpiredWarnings()) {
    closePopup(null, { persistDismissal: false });
    applyMapColors();
    renderPhenomenaPanel();
  }
  const data  = getWarnings();
  const now   = Date.now();
  const nexts = data.map(getExpiryTime).filter(t => t && t > now).sort((a, b) => a - b);
  const delay = nexts.length ? Math.min(nexts[0] - now + 50, 30000) : 30000;
  publicExpiryTimer = setTimeout(schedulePublicExpiryCheck, Math.max(50, delay));
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
initPublicMap();
schedulePublicExpiryCheck();
renderPhenomenaPanel();
renderPopupToggleButton();
showStartupPopups();

window.addEventListener('storage', () => {
  schedulePublicExpiryCheck();
  applyMapColors();
  renderPhenomenaPanel();
});
