// ========== НАСТРОЙКИ ==========
const API_URL = 'https://твой-сервер.com/api/weather'; // ← поменяй на свой адрес
const STORAGE_KEY = 'moldova_weather_warnings';
const AUTH_KEY = 'moldova_admin_auth';
const ADMIN_LOGIN = 'admin';
const ADMIN_PASSWORD = 'admin';

// Короткие коды районов
const shortCodes = {
  "Briceni": "BR", "Ocnița": "OC", "Ocniţa": "OC", "Edineț": "ED", "Edineţ": "ED",
  "Dondușeni": "DN", "Donduşeni": "DN", "Drochia": "DR", "Rîșcani": "RS", "Rîşcani": "RS",
  "Glodeni": "GL", "Fălești": "FL", "Făleşti": "FL", "Sîngerei": "SG", "Sîngerei": "SG",
  "Florești": "FR", "Floreşti": "FR", "Șoldănești": "SD", "Şoldăneşti": "SD",
  "Soroca": "SR", "Rezina": "RZ", "Telenești": "TL", "Teleneşti": "TL", "Orhei": "OR",
  "Ungheni": "UN", "Călărași": "CL", "Călăraşi": "CL", "Nisporeni": "NS",
  "Strășeni": "ST", "Străşeni": "ST", "Criuleni": "CR", "Dubăsari": "DB",
  "Anenii Noi": "AN", "Ialoveni": "IL", "Hîncești": "HN", "Hînceşti": "HN",
  "Cimișlia": "CM", "Cimişlia": "CM", "Leova": "LV", "Căușeni": "CS", "Căuşeni": "CS",
  "Ștefan Vodă": "SV", "Ştefan Vodă": "SV", "Cantemir": "CT", "Cahul": "CH",
  "Taraclia": "TR", "Basarabeasca": "BS",
  "Chișinău": "CHIȘINĂU", "Chişinău": "CHIȘINĂU",
  "Bălți": "Bălți", "Bălţi": "Bălți",
  "Gagauzia": "UTAG", "Găgăuzia": "UTAG", "Unitatea Teritorială Autonomă Găgăuzia": "UTAG",
  "Comrat": "UTAG", "Tiraspol": "Tiraspol", "Bender": "Bender", "Tighina": "Bender"
};

const codeColors = {
  'COD GALBEN': '#FFED00',
  'COD PORTOCALIU': '#FF8A00',
  'COD ROȘU': '#FF0000'
};

const NORMAL_COLOR = '#28D762';

const PHENOMENA = [
  'Obaje (descărcări electrice)',
  'Vînt puternic și vijelie în rafale',
  'Ploi puternice',
  'Ploi torențiale',
  'Ploi de lungă durată',
  'Grindină',
  'Ceață',
  'Ninsori puternice',
  'Viscol',
  'Viscol însoțit de întroieniri',
  'Depuneri de lapoviță pe conductori',
  'Polei pe conductori',
  'Ghețuș (polei pe drumuri)',
  'Scăderea temperaturii aerului',
  'Înghețuri tardive de primăvară și timpurii de toamnă',
  'Ger',
  'Caniculă',
  'Secetă moderată',
  'Secetă puternică',
  'Secetă foarte puternică',
  'Suhovei moderat',
  'Suhovei puternic',
  'Suhovei foarte puternic',
  'Pericol excepțional de incendiu',
  'Pericol excepțional de incendiu de lungă durată'
];

let map = null;
let currentColor = '#FFED00';
let geojsonLayer = null;
const districtData = {};

function showList() {
  document.body.classList.remove('editor-mode');
  scheduleExpiryCheck();
  renderSavedWarnings();
}

function showEditor() {
  document.body.classList.add('editor-mode');
  prepareEditorForm();
  requestAnimationFrame(() => {
    initMap();
    refreshMapSize();
  });
}

function refreshMapSize() {
  if (!map) return;
  map.invalidateSize(true);
  if (geojsonLayer) {
    map.fitBounds(geojsonLayer.getBounds(), { padding: [15, 15] });
  }
}

function prepareEditorForm() {
  document.getElementById('phenomenon').value = '';
  setDateField('intervalFrom', '');
  setDateField('intervalTo', '');
  document.getElementById('codes-container').innerHTML = '';
  addCodeBlock('COD GALBEN');
  updateAddButton();

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  setDateField('emitDate', now.toISOString().slice(0, 16));

  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  const yellowBtn = document.querySelector('.color-btn.yellow');
  if (yellowBtn) yellowBtn.classList.add('active');
  currentColor = '#FFED00';

  resetAll();
  updateSendButton();
}

// ========== КАРТА ==========
function initMap() {
  if (!map) {
    map = L.map('map', {
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
      preferCanvas: true
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentColor = btn.dataset.color;
      });
    });

    fetch('MD_MAP.geojson')
      .then(r => r.json())
      .then(data => {
        geojsonLayer = L.geoJSON(data, {
          style: {
            color: '#f2f7f7',
            weight: 1.2,
            fillColor: '#28D762',
            fillOpacity: 0.85
          },
          onEachFeature: (feature, layer) => {
            const fullName = feature.properties.shapeName ||
                             feature.properties.NAME ||
                             feature.properties.name || '???';

            const label = shortCodes[fullName] || fullName;
            layer.feature.properties._name = fullName;
            layer.feature.properties._label = label;

            layer.bindTooltip(label, {
              permanent: true,
              direction: 'center',
              className: 'district-label'
            });

            layer.on({
              mouseover: function (e) {
                geojsonLayer.eachLayer(l => {
                  const id = getId(l.feature);
                  if (districtData[id]) {
                    l.setStyle({
                      fillColor: districtData[id].color,
                      fillOpacity: 0.85,
                      weight: 1.2,
                      color: '#64748b'
                    });
                  } else {
                    geojsonLayer.resetStyle(l);
                  }
                });

                e.target.setStyle({
                  weight: 3,
                  color: '#0f172a',
                  fillOpacity: 0.95
                });
                e.target.bringToFront();
              },

              mouseout: function (e) {
                const id = getId(feature);

                if (districtData[id]) {
                  e.target.setStyle({
                    fillColor: districtData[id].color,
                    fillOpacity: 0.85,
                    weight: 1.2,
                    color: '#64748b'
                  });
                } else {
                  geojsonLayer.resetStyle(e.target);
                }
              },

              click: function (e) {
                const shift = e.originalEvent && e.originalEvent.shiftKey;
                if (!shift) return;
                L.DomEvent.stop(e);
                paintDistrict(e.target, false);
              },
              dblclick: function (e) {
                if (e.originalEvent && e.originalEvent.shiftKey) return;
                L.DomEvent.stop(e);
                paintDistrict(e.target, true);
              }
            });
          }
        }).addTo(map);

        setTimeout(refreshMapSize, 50);
      })
      .catch(err => {
        alert('Nu s-a putut încărca MD_MAP.geojson\nVerifică dacă fișierul se află lângă index.html și serverul este pornit');
        console.error(err);
      });
  } else {
    refreshMapSize();
  }
}

function getId(feature) {
  return feature.properties.shapeID || feature.properties.shapeName || Math.random().toString(36).slice(2);
}

function setDistrictColor(layer, color) {
  const feature = layer.feature;
  const id = getId(feature);
  const fullName = feature.properties._name;
  const label = feature.properties._label;

  if (color === NORMAL_COLOR) {
    delete districtData[id];
    geojsonLayer.resetStyle(layer);
    updateCount();
    return;
  }

  layer.setStyle({
    fillColor: color,
    fillOpacity: 0.85,
    weight: 1.5,
    color: '#334155'
  });

  districtData[id] = {
    name: fullName,
    label,
    color
  };
  updateCount();
}

function paintDistrict(layer, toggle) {
  if (currentColor === NORMAL_COLOR) {
    setDistrictColor(layer, NORMAL_COLOR);
    return;
  }

  const id = getId(layer.feature);
  if (toggle && districtData[id] && districtData[id].color === currentColor) {
    setDistrictColor(layer, NORMAL_COLOR);
    return;
  }

  setDistrictColor(layer, currentColor);
}

function paintAllDistricts() {
  if (!geojsonLayer) return;
  geojsonLayer.eachLayer(layer => {
    setDistrictColor(layer, currentColor);
  });
  if (typeof geojsonLayer.redraw === 'function') geojsonLayer.redraw();
}

function fillPhenomena() {
  const select = document.getElementById('phenomenon');
  if (!select || select.options.length > 1) return;
  PHENOMENA.forEach(name => {
    select.appendChild(new Option(name, name));
  });
}

function updateCount() {
  const el = document.getElementById('count');
  if (el) el.textContent = Object.keys(districtData).length;
}

// ========== БЛОКИ КОДОВ ==========
const CODE_ORDER = ['COD GALBEN', 'COD PORTOCALIU', 'COD ROȘU'];

function addCodeBlock(preferredCode = null) {
  const container = document.getElementById('codes-container');
  const existing = Array.from(container.querySelectorAll('.code-block'));

  if (existing.length >= 3) {
    alert('Poți adăuga maximum 3 coduri');
    return;
  }

  const usedCodes = existing.map(block => block.querySelector('select').value);

  let codeToAdd = preferredCode;
  if (!codeToAdd || usedCodes.includes(codeToAdd) || !CODE_ORDER.includes(codeToAdd)) {
    codeToAdd = CODE_ORDER.find(code => !usedCodes.includes(code));
  }

  if (!codeToAdd) {
    alert('Toate codurile au fost deja adăugate');
    return;
  }

  const div = document.createElement('div');
  div.className = 'code-block';
  div.dataset.code = codeToAdd;

  div.innerHTML = `
    <div class="code-header">
      <div class="code-dot" style="background:${codeColors[codeToAdd]}"></div>
      <select class="code-select" onchange="onCodeChange(this)">
        <option value="COD GALBEN">COD GALBEN</option>
        <option value="COD PORTOCALIU">COD PORTOCALIU</option>
        <option value="COD ROȘU">COD ROȘU</option>
      </select>
      <button onclick="removeCodeBlock(this)" class="code-remove">x</button>
    </div>
    <textarea></textarea> `;

  div.querySelector('select').value = codeToAdd;
  container.appendChild(div);

  sortCodeBlocks();
  updateAddButton();
}

function onCodeChange(select) {
  const newCode = select.value;
  const block = select.closest('.code-block');
  const container = document.getElementById('codes-container');

  const alreadyUsed = Array.from(container.querySelectorAll('.code-block'))
    .filter(b => b !== block)
    .some(b => b.querySelector('select').value === newCode);

  if (alreadyUsed) {
    alert('Acest cod este deja folosit');
    select.value = block.dataset.code;
    return;
  }

  block.dataset.code = newCode;
  block.querySelector('.code-dot').style.background = codeColors[newCode];
  sortCodeBlocks();
}

function removeCodeBlock(btn) {
  btn.closest('.code-block').remove();
  sortCodeBlocks();
  updateAddButton();
}

function sortCodeBlocks() {
  const container = document.getElementById('codes-container');
  const blocks = Array.from(container.querySelectorAll('.code-block'));

  blocks.sort((a, b) => {
    const codeA = a.querySelector('select').value;
    const codeB = b.querySelector('select').value;
    return CODE_ORDER.indexOf(codeA) - CODE_ORDER.indexOf(codeB);
  });

  blocks.forEach(block => container.appendChild(block));
}

function updateAddButton() {
  const count = document.querySelectorAll('.code-block').length;
  const btn = document.querySelector('.btn-add');

  if (btn) {
    btn.disabled = count >= 3;
    btn.style.opacity = count >= 3 ? '0.5' : '1';
    btn.style.cursor = count >= 3 ? 'not-allowed' : 'pointer';
  }
}

// ========== ОТПРАВКА ==========
function areRequiredFieldsFilled() {
  const emitDate = document.getElementById('emitDate').value.trim();
  const phenomenon = document.getElementById('phenomenon').value.trim();
  const intervalFrom = document.getElementById('intervalFrom').value.trim();
  const intervalTo = document.getElementById('intervalTo').value.trim();
  if (!emitDate || !phenomenon || !intervalFrom || !intervalTo) return false;
  return new Date(intervalTo) > new Date(intervalFrom);
}

function updateSendButton() {
  const btn = document.getElementById('send-btn');
  if (btn) btn.disabled = !areRequiredFieldsFilled();
}

function paintedDistricts() {
  return Object.values(districtData).filter(item => item.color && item.color !== NORMAL_COLOR);
}

function validatePaintedCodes(codes) {
  const districts = paintedDistricts();
  const codeColorSet = codes
    .map(code => codeColors[code])
    .filter(color => color && color !== NORMAL_COLOR);

  if (districts.length === 0 || !districts.some(item => codeColorSet.includes(item.color))) {
    alert('Colorează cel puțin un raion cu culoarea codului selectat');
    return false;
  }

  return true;
}

async function sendToServer() {
  if (!areRequiredFieldsFilled()) return;

  const emitDate = document.getElementById('emitDate').value.trim();
  const phenomenon = document.getElementById('phenomenon').value.trim();
  const intervalFrom = document.getElementById('intervalFrom').value.trim();
  const intervalTo = document.getElementById('intervalTo').value.trim();

  const codes = [];
  document.querySelectorAll('.code-block').forEach(block => {
    codes.push({
      code: block.querySelector('select').value,
      description: block.querySelector('textarea').value.trim()
    });
  });

  if (!validatePaintedCodes(codes.map(item => item.code))) return;

  const payload = {
    id: Date.now().toString(),
    emitDate,
    phenomenon,
    intervalFrom,
    intervalTo,
    interval: `${intervalFrom} – ${intervalTo}`,
    codes: codes,
    districts: paintedDistricts(),
    createdAt: new Date().toISOString()
  };

  try {
    map.invalidateSize(true);
    await new Promise(r => setTimeout(r, 400));

    const mapEl = document.getElementById('map');

    const canvas = await html2canvas(mapEl, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f0f4f8',
      scale: 2,
      logging: false,
      removeContainer: true
    });

    payload.mapImage = canvas.toDataURL('image/png');

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.unshift(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    alert('Trimis!');
    showList();
  } catch (err) {
    console.error(err);
    alert('Ошибка скриншота: ' + err.message);
  }
}

function resetAll() {
  Object.keys(districtData).forEach(key => delete districtData[key]);
  if (geojsonLayer) {
    geojsonLayer.eachLayer(l => geojsonLayer.resetStyle(l));
  }
  updateCount();
}

function getWarningId(item, index) {
  return item.id || item.createdAt || String(index);
}

function formatDateTime(value) {
  if (!value) return '';
  if (!value.includes('T')) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year}, ora ${hours}:${mins}`;
}

function formatInterval(item) {
  if (item.intervalFrom && item.intervalTo) {
    return `${formatDateTime(item.intervalFrom)} – ${formatDateTime(item.intervalTo)}`;
  }
  if (item.interval && item.interval.includes('T')) {
    return formatDateTime(item.interval);
  }
  return item.interval || '';
}

function getExpiryTime(item) {
  const value = item.intervalTo || (item.interval && item.interval.includes('T') ? item.interval : null);
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function removeExpiredWarnings() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const now = Date.now();
  const next = data.filter(item => {
    const expiry = getExpiryTime(item);
    return expiry === null || expiry > now;
  });

  if (next.length !== data.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  }
  return false;
}

let expiryTimer = null;

function scheduleExpiryCheck() {
  clearTimeout(expiryTimer);

  if (removeExpiredWarnings()) {
    closePopup();
    renderSavedWarnings();
  }

  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const now = Date.now();
  const nextTimes = data
    .map(getExpiryTime)
    .filter(time => time && time > now)
    .sort((a, b) => a - b);

  const delay = nextTimes.length ? Math.min(nextTimes[0] - now + 50, 30000) : 30000;
  expiryTimer = setTimeout(scheduleExpiryCheck, Math.max(50, delay));
}

function formatWarningDate(emitDate) {
  return formatDateTime(emitDate).replace(/, ora.*/, '');
}

function codeBorderClass(code) {
  if (!code) return 'yellow';
  if (code.includes('PORTOCALIU')) return 'orange';
  if (code.includes('ROȘU')) return 'red';
  if (code.includes('VERDE')) return 'green';
  return 'yellow';
}

function codeColor(code) {
  if (!code) return '#FFED00';
  if (code.includes('PORTOCALIU')) return '#FF8A00';
  if (code.includes('ROȘU')) return '#FF0000';
  if (code.includes('VERDE')) return '#28D762';
  return '#FFED00';
}

function renderSavedWarnings() {
  const list = document.getElementById('saved-list');
  if (!list) return;

  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (data.length === 0) {
    list.innerHTML = `<div class="empty">Nu esti avertizari</div>`;
    return;
  }

  list.innerHTML = data.map((item, index) => {
    const id = getWarningId(item, index);
    const mainCode = item.codes?.[0]?.code || 'COD GALBEN';
    const badges = (item.codes || []).map(c => {
      return `<span class="badge" style="background:${codeColor(c.code)}">${c.code}</span>`;
    }).join('');

    const date = formatWarningDate(item.emitDate);
    const interval = formatInterval(item);
    const meta = [date, interval].filter(Boolean).join(' · ');

    return `
      <div class="card ${codeBorderClass(mainCode)}" onclick="openPopup(${index})">
        <div>
          <div class="card-title">${item.phenomenon || 'Avertizare meteorologică'}</div>
          <div class="card-meta">${meta}</div>
        </div>
        <div class="card-codes">
          ${badges}
          <button class="card-delete" onclick="deleteWarning(event, '${id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function openPopup(index) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const item = data[index];
  if (!item) return;

  document.getElementById('p-date').textContent = formatDateTime(item.emitDate) || '—';
  document.getElementById('p-phenomenon').textContent = item.phenomenon || '—';
  document.getElementById('p-interval').textContent = formatInterval(item) || '—';
  document.getElementById('popup-img').src = item.mapImage || '';

  const codesHtml = (item.codes || []).map(c => {
    const cls = codeBorderClass(c.code);
    const color = codeColor(c.code);

    return `
      <div class="code-item ${cls}">
        <div class="code-title">
          <div class="dot" style="background:${color}"></div>
          ${c.code}
        </div>
        <div class="code-desc">${c.description || ''}</div>
      </div>
    `;
  }).join('');

  document.getElementById('p-codes').innerHTML = codesHtml;
  document.getElementById('overlay').classList.add('active');
}

function closePopup(e) {
  if (!e || e.target.id === 'overlay') {
    document.getElementById('overlay').classList.remove('active');
  }
}

function deleteWarning(event, id) {
  event.stopPropagation();
  if (!confirm('Stergere avertizare ?')) return;

  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const next = data.filter((item, index) => getWarningId(item, index) !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  closePopup();
  renderSavedWarnings();
}

function clearAllWarnings() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (data.length === 0) return;
  if (!confirm('Stergere toate avertizare ?')) return;

  localStorage.removeItem(STORAGE_KEY);
  renderSavedWarnings();
}

// ========== КАЛЕНДАРЬ ==========
const CALENDAR_MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

const calendarState = {
  fieldId: null,
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  selected: new Date()
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toDateTimeValue(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function parseDateTimeValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function setDateField(id, value) {
  const input = document.getElementById(id);
  if (!input) return;
  input.value = value || '';
  updateDateTrigger(id);
  updateSendButton();
}

function updateDateTrigger(id) {
  const input = document.getElementById(id);
  const label = document.getElementById(id + '-label');
  const trigger = document.getElementById(id + '-trigger');
  if (!input || !label || !trigger) return;

  if (input.value) {
    label.textContent = formatDateTime(input.value);
    trigger.classList.add('has-value');
  } else {
    label.textContent = 'Alege data și ora';
    trigger.classList.remove('has-value');
  }
}

function fillTimeSelects() {
  const hour = document.getElementById('cal-hour');
  const minute = document.getElementById('cal-minute');
  if (!hour.options.length) {
    for (let i = 0; i < 24; i++) {
      hour.appendChild(new Option(pad2(i), i));
    }
  }
  if (!minute.options.length) {
    for (let i = 0; i < 60; i++) {
      minute.appendChild(new Option(pad2(i), i));
    }
  }
}

function commitCalendarValue() {
  if (!calendarState.fieldId || !calendarState.selected) return;
  const hour = Number(document.getElementById('cal-hour').value);
  const minute = Number(document.getElementById('cal-minute').value);
  const next = new Date(calendarState.selected);
  next.setHours(hour, minute, 0, 0);
  calendarState.selected = next;
  setDateField(calendarState.fieldId, toDateTimeValue(next));
}

function renderCalendar() {
  document.getElementById('calendar-title').textContent =
    `${CALENDAR_MONTHS[calendarState.viewMonth]} ${calendarState.viewYear}`;

  const first = new Date(calendarState.viewYear, calendarState.viewMonth, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(calendarState.viewYear, calendarState.viewMonth, 1 - startOffset);
  const today = new Date();
  const days = document.getElementById('calendar-days');
  days.innerHTML = '';

  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const inMonth = date.getMonth() === calendarState.viewMonth;
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    const selected = calendarState.selected;
    const isSelected = selected &&
      date.getFullYear() === selected.getFullYear() &&
      date.getMonth() === selected.getMonth() &&
      date.getDate() === selected.getDate();

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = date.getDate();
    btn.className = 'h-9 rounded-lg text-sm font-medium transition';
    if (!inMonth) btn.className += ' text-slate-300';
    else if (isSelected) btn.className += ' bg-blue-600 text-white shadow-sm';
    else if (isToday) btn.className += ' bg-blue-50 font-semibold text-blue-700';
    else btn.className += ' text-slate-700 hover:bg-slate-100';

    btn.addEventListener('click', () => {
      const hour = Number(document.getElementById('cal-hour').value);
      const minute = Number(document.getElementById('cal-minute').value);
      calendarState.selected = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);
      calendarState.viewYear = date.getFullYear();
      calendarState.viewMonth = date.getMonth();
      commitCalendarValue();
      renderCalendar();
    });
    days.appendChild(btn);
  }
}

function positionCalendar(fieldId) {
  const trigger = document.getElementById(fieldId + '-trigger');
  const pop = document.getElementById('calendar-popover');
  const rect = trigger.getBoundingClientRect();
  const popWidth = 340;
  let left = Math.min(rect.left, window.innerWidth - popWidth - 12);
  left = Math.max(12, left);
  pop.classList.remove('hidden');
  const popHeight = pop.offsetHeight;
  let top = rect.bottom + 8;
  if (top + popHeight > window.innerHeight - 12) {
    top = Math.max(12, rect.top - popHeight - 8);
  }
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
}

function openCalendar(fieldId) {
  fillTimeSelects();
  calendarState.fieldId = fieldId;
  const current = parseDateTimeValue(document.getElementById(fieldId).value) || new Date();
  calendarState.selected = current;
  calendarState.viewYear = current.getFullYear();
  calendarState.viewMonth = current.getMonth();
  document.getElementById('cal-hour').value = String(current.getHours());
  document.getElementById('cal-minute').value = String(current.getMinutes());
  renderCalendar();
  positionCalendar(fieldId);
}

function closeCalendar(apply) {
  if (apply) commitCalendarValue();
  document.getElementById('calendar-popover').classList.add('hidden');
  calendarState.fieldId = null;
}

function shiftCalendarMonth(delta) {
  calendarState.viewMonth += delta;
  if (calendarState.viewMonth < 0) {
    calendarState.viewMonth = 11;
    calendarState.viewYear -= 1;
  } else if (calendarState.viewMonth > 11) {
    calendarState.viewMonth = 0;
    calendarState.viewYear += 1;
  }
  renderCalendar();
}

function setCalendarToday() {
  const now = new Date();
  calendarState.selected = now;
  calendarState.viewYear = now.getFullYear();
  calendarState.viewMonth = now.getMonth();
  document.getElementById('cal-hour').value = String(now.getHours());
  document.getElementById('cal-minute').value = String(now.getMinutes());
  commitCalendarValue();
  renderCalendar();
}

function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === '1';
}

function handleLogin(event) {
  event.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const error = document.getElementById('login-error');

  if (user === ADMIN_LOGIN && pass === ADMIN_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, '1');
    error.textContent = '';
    startAdmin();
    return;
  }

  error.textContent = 'Login sau parolă incorectă';
}

function handleLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  document.body.classList.remove('logged-in', 'editor-mode');
  location.reload();
}

function startAdmin() {
  document.body.classList.add('logged-in');
  initMap();
  scheduleExpiryCheck();
  renderSavedWarnings();
  fillTimeSelects();
  fillPhenomena();

  document.getElementById('phenomenon').addEventListener('change', updateSendButton);
  document.getElementById('cal-hour').addEventListener('change', commitCalendarValue);
  document.getElementById('cal-minute').addEventListener('change', commitCalendarValue);

  document.addEventListener('mousedown', (event) => {
    const pop = document.getElementById('calendar-popover');
    if (pop.classList.contains('hidden')) return;
    if (pop.contains(event.target) || event.target.closest('.date-trigger')) return;
    closeCalendar(true);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCalendar(true);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) startAdmin();
});
window.addEventListener('storage', () => {
  if (!isLoggedIn()) return;
  scheduleExpiryCheck();
  renderSavedWarnings();
});
