# AGENTS.md

## Cursor Cloud specific instructions

This is a **Laravel 13 + SQLite** meteorological warning application for Moldova.

### Running the app

```bash
composer install
php artisan migrate --seed   # creates SQLite DB + seeds admin user
php artisan serve --host=0.0.0.0 --port=8000
```

- **Public map:** http://localhost:8000/
- **Login:** http://localhost:8000/login.html  (`admin` / `admin`)
- **Admin:** http://localhost:8000/admin  (protected)

### Changing admin password

Edit `.env`:
```
ADMIN_USER=admin
ADMIN_PASSWORD=НовыйПароль
```
Then: `php artisan db:seed --class=AdminUserSeeder`

### Project structure

```
app/
  Models/Warning.php         Eloquent (SQLite): phenomenon, dates, codes, districts
  Models/AdminUser.php       Eloquent: username + bcrypt password
  Http/Controllers/Api/
    AuthController.php       POST /api/login, /api/logout, GET /api/me
    WarningController.php    GET/POST/DELETE /api/warnings
  Http/Middleware/RequireAdminSession.php

database/migrations/         warnings + admin_users tables
database/seeders/            AdminUserSeeder (reads from .env)

public/                      Static frontend
  index.html                 Public map (/)
  admin.html                 Admin panel (/admin)
  login.html                 Login page
  js/models/warnings.js      API-driven (fetch /api/warnings)
  js/models/auth.js          checkAuth via /api/me
  js/views/                  Rendering functions
  js/controllers/            Admin and public map controllers
  css/style.css
  data/MD_MAP.geojson

routes/
  api.php                    All API routes
  web.php                    / and /admin page routes
```

### External CDN dependencies

Leaflet, Tailwind CSS, html2canvas, Google Fonts — loaded at runtime. Outbound network access required in browser.
