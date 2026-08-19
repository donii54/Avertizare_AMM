# AGENTS.md

## Cursor Cloud specific instructions

This branch (`cursor/frontend-only-693b`) is a **static frontend only** — no server, no PHP, no Node.js.

Data is stored in browser `localStorage`.

### How to run

```bash
cd frontend
python3 -m http.server 8080 --bind 0.0.0.0
```

- **Public map:** http://localhost:8080/
- **Admin panel:** http://localhost:8080/admin.html (login: `admin` / `admin`)

Or use VS Code with the Live Server extension.

### Password

Edit `frontend/js/models/auth.js`:

```js
const ADMIN_LOGIN    = 'admin';
const ADMIN_PASSWORD = 'admin';
```

### Structure

```
frontend/
  admin.html          Admin panel
  index.html          Public map
  css/style.css
  data/MD_MAP.geojson
  js/
    district-codes.js
    models/warnings.js      localStorage CRUD
    models/auth.js          sessionStorage auth
    views/admin-view.js
    views/calendar-view.js
    controllers/admin.js
    controllers/public-map.js
```
