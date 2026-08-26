/**
 * Live embeddable map widget — polls /api/maps/:token and repaints.
 */

const EMBED_NORMAL = '#28D762';
const POLL_MS = 3000;

let embedMap = null;
let embedLayer = null;
let lastUpdated = null;
let token = '';

function applyDistricts(districts) {
  if (!embedLayer) return;
  const byName = {};
  (districts || []).forEach(d => { if (d.name) byName[d.name] = d.color; });
  embedLayer.eachLayer(layer => {
    const name = layer.feature.properties._name;
    const color = byName[name];
    if (color) {
      layer.setStyle({ fillColor: color, fillOpacity: 0.85, weight: 1.2, color: '#64748b' });
    } else {
      embedLayer.resetStyle(layer);
    }
  });
}

async function refreshWidget() {
  try {
    const data = await getMap(token);
    if (data.updatedAt === lastUpdated) return;
    lastUpdated = data.updatedAt;
    const titleEl = document.getElementById('embed-title');
    if (titleEl) titleEl.textContent = data.title || 'Hartă';
    applyDistricts(data.districts);
  } catch (err) {
    const titleEl = document.getElementById('embed-title');
    if (titleEl) titleEl.textContent = 'Harta nu este disponibilă';
  }
}

function bootEmbed() {
  token = location.pathname.split('/').filter(Boolean).pop() || '';
  embedMap = L.map('embed-map', {
    zoomControl: false, dragging: false, touchZoom: false,
    scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false,
    keyboard: false, attributionControl: false, preferCanvas: true,
  });

  fetch('/data/MD_MAP.geojson')
    .then(r => r.json())
    .then(data => {
      embedLayer = L.geoJSON(data, {
        style: { color: '#f2f7f7', weight: 1.2, fillColor: EMBED_NORMAL, fillOpacity: 0.85 },
        onEachFeature: (feature, layer) => {
          const fullName = feature.properties.shapeName || '???';
          const label = districtLabel(fullName);
          layer.feature.properties._name = fullName;
          layer.bindTooltip(label, { permanent: true, direction: 'center', className: 'district-label' });
        },
      }).addTo(embedMap);
      embedMap.fitBounds(embedLayer.getBounds(), { padding: [12, 12] });
      refreshWidget();
      setInterval(refreshWidget, POLL_MS);
    });
}

window.addEventListener('DOMContentLoaded', bootEmbed);
window.addEventListener('resize', () => {
  if (embedMap && embedLayer) {
    embedMap.invalidateSize(true);
    embedMap.fitBounds(embedLayer.getBounds(), { padding: [12, 12] });
  }
});
