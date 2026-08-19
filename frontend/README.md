# Avertizare AMM — Фронтенд (без бэкенда)

Чистая статическая версия приложения. Данные хранятся в `localStorage` браузера.
Никакого сервера, PHP или Node.js не нужно.

## Как открыть

### Вариант 1 — VS Code (Live Server, рекомендуется)

1. Открой папку `frontend/` в VS Code
2. Установи расширение **Live Server** (ritwickdey.LiveServer)
3. Нажми **Go Live** внизу справа
4. Откроется http://127.0.0.1:5500

> **Важно:** открывать через `file://` нельзя — браузер блокирует загрузку
> `MD_MAP.geojson` из-за политики CORS. Нужен хотя бы локальный HTTP-сервер.

### Вариант 2 — Python (если нет VS Code)

```bash
cd frontend
python3 -m http.server 8080
# открой http://localhost:8080
```

## Страницы

| Файл | URL | Описание |
|---|---|---|
| `admin.html` | /admin.html | Панель администратора (логин admin/admin) |
| `index.html` | / | Публичная карта с предупреждениями |

## Изменить пароль

Открой `js/models/auth.js` и измени:

```js
const ADMIN_LOGIN    = 'admin';
const ADMIN_PASSWORD = 'admin';
```

## Структура

```
frontend/
  admin.html          Админ-панель
  index.html          Публичная карта
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
