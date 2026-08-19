# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **static** meteorological warning app for Moldova (HTML/CSS/JS + Leaflet). There is no package manager, build step, or backend server in the repo.

### Running the app

A local HTTP server is required because `MD_MAP.geojson` is loaded via `fetch()` (opening files directly with `file://` will fail).

The Cloud Agent environment starts a static server automatically via `.cursor/environment.json` terminals:

- **Admin panel:** http://localhost:8080/index.html (login `admin` / `admin`)
- **Public map:** http://localhost:8080/webpage.html

To start manually in a shell:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

### Testing a core flow

1. Open the admin panel and log in with `admin` / `admin`.
2. Click **Adaugă avertizare**, fill dates/phenomenon, click districts on the map to paint warning colors, then save.
3. Open the public page to verify the warning appears on the map (data is stored in browser `localStorage` under key `moldova_weather_warnings`).

### External CDN dependencies

The app loads Leaflet, Tailwind CSS, html2canvas, and Google Fonts from public CDNs at runtime. No install step is needed, but outbound network access must be available when testing in a browser.

### Lint / tests

There are no automated lint or test scripts in this repository.
