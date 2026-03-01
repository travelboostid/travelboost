<?php

use App\Http\Controllers\Admin\AgentController;
use App\Http\Controllers\Admin\HomeController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VendorController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
  Route::get('/', [HomeController::class, 'show'])->name('home');
  Route::resource('users', UserController::class)->names('users');
  Route::resource('vendors', VendorController::class)->names('vendors');
  Route::resource('agents', AgentController::class)->names('agents');
});
