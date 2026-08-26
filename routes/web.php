<?php

use App\Http\Middleware\AllowIframeEmbed;
use App\Http\Middleware\RequireAdminSession;
use Illuminate\Http\Middleware\FrameGuard;
use Illuminate\Support\Facades\Route;

// Public map — no authentication
Route::get('/', function () {
    return response(file_get_contents(public_path('index.html')))
        ->header('Content-Type', 'text/html; charset=UTF-8');
});

// Login page — after success the client opens the warning editor at /admin#editor
Route::get('/login', function () {
    return response(file_get_contents(public_path('login.html')))
        ->header('Content-Type', 'text/html; charset=UTF-8');
});

// Warning editor (and saved-warning list). Guests are redirected to /login.
Route::get('/admin', function () {
    return response(file_get_contents(public_path('admin.html')))
        ->header('Content-Type', 'text/html; charset=UTF-8');
})->middleware(RequireAdminSession::class);

Route::get('/studio', function () {
    return response(file_get_contents(public_path('studio.html')))
        ->header('Content-Type', 'text/html; charset=UTF-8');
})->middleware(RequireAdminSession::class);

Route::get('/embed/{token}', function (string $token) {
    return response(file_get_contents(public_path('embed.html')))
        ->header('Content-Type', 'text/html; charset=UTF-8')
        ->header('Cache-Control', 'no-store');
})->middleware(AllowIframeEmbed::class)->withoutMiddleware([FrameGuard::class]);

Route::get('/widget-demo/{token}', function () {
    return response(file_get_contents(public_path('widget-demo.html')))
        ->header('Content-Type', 'text/html; charset=UTF-8');
});
