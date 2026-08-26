# AGENTS.md

## Cursor Cloud specific instructions

This is a **Laravel 13 + SQLite** meteorological warning application for Moldova.

### Running the app

First-time setup and the one-command start are documented in `README.md`.

```bash
composer setup
composer run dev
```

`composer run dev` starts Laravel (`:8000`) and Vite (`:5173`) together via `php artisan dev`.

- **Public map:** http://localhost:8000/  (no login)
- **Login:** http://localhost:8000/login  (`admin` / `admin`)
- **Editor:** after a successful login the browser opens `/admin#editor` (warning map editor). `/admin` without the hash shows the saved-warning list. Guests are redirected to `/login`.
- **Map widget studio:** http://localhost:8000/studio (admin). Create a map, paint districts, copy the iframe. The public widget is http://localhost:8000/embed/{token} and refreshes itself when the map is saved. Preview: http://localhost:8000/widget-demo/{token}

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
  Models/EmbeddableMap.php   Eloquent: token, title, districts
  Http/Controllers/Api/
    AuthController.php       POST /api/login, /api/logout, GET /api/me
    WarningController.php    GET/POST/DELETE /api/warnings
    EmbeddableMapController.php  GET/POST/PUT/DELETE /api/maps
  Http/Middleware/RequireAdminSession.php
  Http/Middleware/AllowIframeEmbed.php

database/migrations/         warnings + admin_users + embeddable_maps
database/seeders/            AdminUserSeeder (reads from .env)

public/                      Static frontend
  index.html                 Public map (/)
  admin.html                 Admin panel (/admin)
  studio.html                Embeddable map editor (/studio)
  embed.html                 Iframe widget (/embed/{token})
  widget-demo.html           Sample host page (/widget-demo/{token})
  login.html                 Login page
  js/models/warnings.js      API-driven (fetch /api/warnings)
  js/models/maps.js          API-driven (fetch /api/maps)
  js/models/auth.js          checkAuth via /api/me
  js/views/                  Rendering functions
  js/controllers/            Admin, public map, studio, embed widget
  css/style.css
  data/MD_MAP.geojson

routes/
  api.php                    All API routes
  web.php                    /, /admin, /studio, /embed/{token}
```

### External CDN dependencies

Leaflet, Tailwind CSS, html2canvas, Google Fonts — loaded at runtime. Outbound network access required in browser.
