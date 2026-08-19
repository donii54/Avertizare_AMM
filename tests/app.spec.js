const { test, expect } = require('playwright/test');

const BASE = process.env.APP_URL || 'http://127.0.0.1:8080';
const STORAGE_KEY = 'moldova_weather_warnings';

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.removeItem(key);
  }, STORAGE_KEY);
});

test('admin login and create warning', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto(`${BASE}/index.html`);
  await page.fill('#login-user', 'admin');
  await page.fill('#login-pass', 'admin');
  await page.click('button.login-submit');

  await expect(page.locator('#list-view')).toBeVisible();
  await page.click('button.btn-create');
  await expect(page.locator('#editor-view')).toBeVisible();

  await page.selectOption('#phenomenon', { index: 1 });

  const setDate = async (fieldId, day) => {
    await page.click(`#${fieldId}-trigger`);
    await expect(page.locator('#calendar-popover')).not.toHaveClass(/hidden/);
    await page.locator('#calendar-days button').filter({ hasText: String(day) }).first().click();
    await page.click('button:has-text("Gata")');
  };

  const today = new Date();
  await setDate('emitDate', today.getDate());
  await setDate('intervalFrom', today.getDate());
  await setDate('intervalTo', Math.min(today.getDate() + 2, 28));

  await page.click('.color-btn.yellow');
  const map = page.locator('#map');
  await map.dblclick({ position: { x: 280, y: 220 } });

  const sendBtn = page.locator('#send-btn');
  await expect(sendBtn).toBeEnabled({ timeout: 5000 });

  page.once('dialog', (dialog) => dialog.accept());
  await sendBtn.click();

  await expect(page.locator('.card')).toHaveCount(1);
  expect(errors.some((e) => e.includes('tailwind is not defined'))).toBe(false);
});

test('public page renders saved warning', async ({ page }) => {
  const warning = {
    id: 'test-warning',
    emitDate: '2026-08-19T10:00',
    phenomenon: 'Test furtună',
    intervalFrom: '2026-08-19T10:00',
    intervalTo: '2026-08-21T10:00',
    interval: '2026-08-19T10:00 – 2026-08-21T10:00',
    codes: [{ code: 'COD GALBEN', description: 'Test descriere' }],
    districts: [{ name: 'Calarasi', label: 'CL', color: '#FFED00' }],
    createdAt: new Date().toISOString()
  };

  await page.addInitScript(({ key, payload }) => {
    localStorage.setItem(key, JSON.stringify([payload]));
  }, { key: STORAGE_KEY, payload: warning });

  await page.goto(`${BASE}/webpage.html`);
  await expect(page.locator('#phenomena-panel article')).toHaveCount(1);
  await expect(page.locator('#phenomena-panel')).toContainText('Test furtună');
});

test('district labels use short codes from GeoJSON names', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  await page.fill('#login-user', 'admin');
  await page.fill('#login-pass', 'admin');
  await page.click('button.login-submit');
  await page.click('button.btn-create');

  await page.waitForFunction(() => {
    return document.querySelectorAll('.district-label').length > 0;
  }, { timeout: 10000 });

  const labels = await page.locator('.district-label').allTextContents();
  expect(labels).toContain('CL');
  expect(labels).toContain('CHIȘINĂU');
  expect(labels.some((t) => t === 'Calarasi')).toBe(false);
});

test('popup auto-opens after reload', async ({ page }) => {
  const warning = {
    id: 'popup-test',
    emitDate: '2026-08-19T10:00',
    phenomenon: 'Test popup',
    intervalFrom: '2026-08-19T10:00',
    intervalTo: '2026-08-21T10:00',
    codes: [{ code: 'COD GALBEN', description: 'desc' }],
    districts: [{ name: 'Calarasi', label: 'CL', color: '#FFED00' }],
    createdAt: new Date().toISOString()
  };

  await page.addInitScript(({ key, payload }) => {
    localStorage.setItem(key, JSON.stringify([payload]));
  }, { key: STORAGE_KEY, payload: warning });

  await page.goto(`${BASE}/webpage.html`);
  const overlay = page.locator('#overlay');
  await expect(overlay).toHaveClass(/flex/);

  await page.getByRole('button', { name: 'Închide' }).click();
  await expect(overlay).toHaveClass(/hidden/);

  await page.reload();
  await expect(overlay).toHaveClass(/flex/);
});
