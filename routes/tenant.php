<?php

use App\Http\Controllers\Tenant\HomeController;
use App\Http\Controllers\Tenant\TourController;
use Illuminate\Support\Facades\Route;

$appHost = env('APP_HOST', 'localhost');
Route::domain('{username}.' . $appHost)->group(function () {
  // log current host

  Route::get('/', [HomeController::class, 'index']);
  Route::get('/tours', [TourController::class, 'index']);
});
