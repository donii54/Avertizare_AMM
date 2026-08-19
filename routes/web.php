<?php

use Illuminate\Support\Facades\Route;

// Public map
Route::get('/', function () {
    return file_get_contents(public_path('index.html'));
});

// Admin panel — always serves admin.html.
// Authentication is handled client-side: the page shows a login form
// if the user is not authenticated (/api/me returns 401).
Route::get('/admin', function () {
    return file_get_contents(public_path('admin.html'));
});
