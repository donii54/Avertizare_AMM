# AGENTS.md

## Cursor Cloud specific instructions

This repository is a meteorological warning app for Moldova with two backends:

| Backend | Stack | Port | Entry |
|---|---|---|---|
| **Laravel (current)** | PHP 8.3 + SQLite | 8000 | `backend/` |
| Node.js (legacy) | Express + JWT cookies | 8080 | `server/app.js` |

### Running the Laravel backend (recommended)

```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

- **Public map:** http://localhost:8000/
- **Login:** http://localhost:8000/login.html  (`admin` / `admin`)
- **Admin panel:** http://localhost:8000/admin  (protected, requires login)

### First-time setup (backend/)

```bash
cd backend
cp .env.example .env.example  # already configured for SQLite
php artisan migrate --seed     # creates DB + seeds admin user
php artisan serve --host=0.0.0.0 --port=8000
```

### Changing admin password

Edit `backend/.env`:

```
ADMIN_USER=admin
ADMIN_PASSWORD=МойНовыйПароль
```

Then re-seed: `php artisan db:seed --class=AdminUserSeeder`

### Architecture

```
backend/                  Laravel 13 application
  app/
    Models/Warning.php    Eloquent model (SQLite)
    Models/AdminUser.php
    Http/Controllers/Api/
      AuthController.php  POST /api/login, /api/logout, GET /api/me
      WarningController.php GET/POST/DELETE /api/warnings
    Http/Middleware/RequireAdminSession.php
  database/migrations/    warnings + admin_users tables
  database/database.sqlite SQLite data file
  public/                 Static frontend (HTML/CSS/JS)
    index.html            Public map (/)
    admin.html            Admin panel (/admin)
    login.html            Login page
    js/
      district-codes.js
      models/warnings.js  Fetches from /api/warnings (no localStorage)
      models/auth.js      checkAuth via /api/me
      views/
      controllers/

public/                   Legacy static frontend (for Node.js backend)
server/                   Legacy Node.js/Express backend
```

### Tests

Playwright tests target the Node.js backend on port 8080:

```bash
npm test   # runs against http://localhost:8080
```

Laravel backend tests can be run with:

```bash
cd backend && php artisan test
```

### External CDN dependencies

Leaflet, Tailwind CSS, html2canvas, Google Fonts — loaded from CDN at runtime. Outbound network access required in browser.
