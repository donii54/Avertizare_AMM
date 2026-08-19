<?php

use App\Http\Middleware\RequireAdminSession;
use Illuminate\Support\Facades\Route;

// Public pages are served as static files by the framework.
// Only /admin requires authentication.

Route::get('/admin', function () {
    return file_get_contents(public_path('admin.html'));
})->middleware(RequireAdminSession::class);

// Public map (default page)
Route::get('/', function () {
    return file_get_contents(public_path('index.html'));
});
