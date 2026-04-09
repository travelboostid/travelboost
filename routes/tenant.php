<?php

use App\Http\Controllers\Tenant\HomeController;
use App\Http\Controllers\Tenant\TourController;
use App\Models\Tour;
use Illuminate\Support\Facades\Route;

$appHost = env('APP_HOST', 'localhost');
Route::domain('{username}.' . $appHost)->group(function () {
  Route::get('/', [HomeController::class, 'index']);
  Route::get('/tours', [TourController::class, 'index']);
});
