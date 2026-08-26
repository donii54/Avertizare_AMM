# Avertizări Meteorologice

Приложение метеорологических предупреждений для Молдовы: публичная карта, вход администратора и редактор авертизер. Бэкенд — **Laravel 13 + SQLite**, фронтенд — статические страницы в `public/` плюс Vite для сборки ассетов.

## Требования

- PHP 8.3+
- [Composer](https://getcomposer.org/)
- Node.js 22+ и npm

## Установка

```bash
composer setup
```

Эта команда ставит PHP- и npm-зависимости, создаёт `.env`, генерирует ключ приложения и прогоняет миграции.

Если нужно создать администратора (`admin` / `admin` по умолчанию):

```bash
php artisan migrate --seed
```

Логин и пароль можно сменить в `.env` (`ADMIN_USER`, `ADMIN_PASSWORD`) и затем:

```bash
php artisan db:seed --class=AdminUserSeeder
```

## Запуск одной командой

Фронтенд (Vite) и бэкенд (Laravel) стартуют вместе:

```bash
composer run dev
```

То же самое: `php artisan dev` или `composer start`.

| Процесс | Адрес |
|---|---|
| Laravel — сайт и API | http://localhost:8000 |
| Vite — фронтенд-сборка | http://localhost:5173 |

Остановка: `Ctrl+C` в том же терминале.

### Страницы

| URL | Назначение |
|---|---|
| http://localhost:8000/ | Публичная карта предупреждений (без входа) |
| http://localhost:8000/login | Вход администратора |
| http://localhost:8000/admin | Редактор авертизер (`/admin#editor`) |
| http://localhost:8000/studio | Редактор встраиваемых карт |
| http://localhost:8000/embed/{token} | Виджет карты (iframe). Обновляется сам после правок в studio |
| http://localhost:8000/widget-demo/{token} | Пример страницы с встроенным iframe |

Учётные данные по умолчанию: `admin` / `admin`.

### Виджет карты

1. Войдите и откройте http://localhost:8000/studio
2. Создайте карту, раскрасьте районы. Сохранение идёт автоматически.
3. Скопируйте код iframe или откройте ссылку `/embed/{token}`.
4. Вставьте iframe на любой сайт. Пока iframe открыт, он опрашивает API каждые 3 секунды и показывает новые цвета без перезагрузки.

## Тесты

```bash
composer test
```

## Структура

```
app/                 Laravel: модели, API, middleware
routes/web.php       Страницы /, /login, /admin
routes/api.php       /api/login, /api/me, /api/warnings
public/              Публичная карта, вход, редактор
database/            Миграции SQLite и сидер администратора
```
